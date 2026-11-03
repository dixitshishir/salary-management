import { Alert, Button, Group, NumberInput, Paper, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { referenceOptions, useReference } from '../api/hooks'
import { insightsApi } from '../api/insights'
import type { RaiseSimulationInput } from '../api/types'
import { StatCard } from '../components/StatCard'
import { formatCompactUsd, formatCount, formatMoney } from '../lib/format'

export function RaisePlannerPage() {
  const options = referenceOptions(useReference().data)
  const [percent, setPercent] = useState<number | ''>(5)
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const [department, setDepartment] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState<string | null>(null)
  const simulation = useMutation({ mutationFn: (input: RaiseSimulationInput) => insightsApi.simulateRaise(input) })
  const result = simulation.data

  return (
    <Stack>
      <div>
        <Title order={2}>Raise planner</Title>
        <Text c="dimmed" size="sm">
          See what a raise would cost before you commit to it. Nothing here changes anyone's salary.
        </Text>
      </div>

      <Paper withBorder p="md">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (percent === '') return
            simulation.mutate({
              percent,
              country_code: countryCode ?? undefined,
              department: department ?? undefined,
              job_title: jobTitle ?? undefined,
            })
          }}
        >
          <Group align="flex-end">
            <NumberInput label="Raise (%)" value={percent} onChange={(v) => setPercent(typeof v === 'number' ? v : '')} min={0.1} max={100} decimalScale={2} w={120} />
            <Select label="Country" placeholder="All" data={options.countries} value={countryCode} onChange={setCountryCode} clearable searchable w={240} />
            <Select label="Department" placeholder="All" data={options.departments} value={department} onChange={setDepartment} clearable searchable w={200} />
            <Select label="Job title" placeholder="All" data={options.jobTitles} value={jobTitle} onChange={setJobTitle} clearable searchable w={240} />
            <Button type="submit" loading={simulation.isPending} disabled={percent === ''}>
              Calculate
            </Button>
          </Group>
        </form>
      </Paper>

      {simulation.isError && <Alert color="red">{simulation.error.message}</Alert>}

      {result && (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }}>
            <StatCard label="Employees affected" value={formatCount(result.affected_headcount)} />
            <StatCard label="Annual cost" value={formatMoney(result.raise_cost_usd, 'USD')} hint={`${result.percent}% raise`} />
            <StatCard label="Payroll today" value={formatCompactUsd(result.current_payroll_usd)} />
            <StatCard label="Payroll after" value={formatCompactUsd(result.new_payroll_usd)} />
          </SimpleGrid>
          <Paper withBorder p="md">
            <Title order={4} mb="xs">
              Cost by country
            </Title>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Country</Table.Th>
                  <Table.Th ta="right">Employees</Table.Th>
                  <Table.Th ta="right">Payroll today</Table.Th>
                  <Table.Th ta="right">Raise cost</Table.Th>
                  <Table.Th ta="right">Raise cost (USD)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.by_country.map((row) => (
                  <Table.Tr key={row.country_code}>
                    <Table.Td>{row.country_code}</Table.Td>
                    <Table.Td ta="right">{formatCount(row.headcount)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.current_payroll, row.currency)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.raise_cost, row.currency)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.raise_cost_usd, 'USD')}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </>
      )}
    </Stack>
  )
}
