import { Alert, Badge, Group, Loader, Paper, SegmentedControl, Select, Stack, Table, Text, Title } from '@mantine/core'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { referenceOptions, useReference } from '../api/hooks'
import { insightsApi } from '../api/insights'
import { formatCompaGap, formatCount, formatMoney } from '../lib/format'

const THRESHOLDS = [
  { value: '0.1', label: '±10%' },
  { value: '0.2', label: '±20%' },
  { value: '0.3', label: '±30%' },
]

export function OutliersPage() {
  const [threshold, setThreshold] = useState('0.2')
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const options = referenceOptions(useReference().data)
  const report = useQuery({
    queryKey: ['insights', 'outliers', threshold, countryCode],
    queryFn: () => insightsApi.outliers({ threshold: Number(threshold), country_code: countryCode ?? undefined }),
    placeholderData: keepPreviousData,
  })

  return (
    <Stack>
      <div>
        <Title order={2}>Pay outliers</Title>
        <Text c="dimmed" size="sm" maw={720}>
          Employees paid well above or below the median for the same job title in the same country (groups of 5 or
          more). These are worth a second look before a pay review, not proof that something is wrong.
        </Text>
      </div>

      <Group>
        <SegmentedControl aria-label="Threshold" data={THRESHOLDS} value={threshold} onChange={setThreshold} />
        <Select aria-label="Country" placeholder="All countries" data={options.countries} value={countryCode} onChange={setCountryCode} clearable w={260} />
      </Group>

      {report.isError && <Alert color="red">{report.error.message}</Alert>}
      {!report.data ? (
        <Loader />
      ) : (
        <>
          <Text size="sm">
            <b>{formatCount(report.data.total_count)}</b> employees flagged
            {report.data.total_count > report.data.outliers.length && ` (showing the ${report.data.outliers.length} furthest from their peers)`}
          </Text>
          <Paper withBorder>
            <Table.ScrollContainer minWidth={900}>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Employee</Table.Th>
                    <Table.Th>Job title</Table.Th>
                    <Table.Th>Country</Table.Th>
                    <Table.Th ta="right">Salary</Table.Th>
                    <Table.Th ta="right">Peer median</Table.Th>
                    <Table.Th ta="right">Gap</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {report.data.outliers.map((o) => (
                    <Table.Tr key={o.employee.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{o.employee.full_name}</Text>
                        <Text size="xs" c="dimmed" ff="monospace">{o.employee.employee_code}</Text>
                      </Table.Td>
                      <Table.Td>{o.employee.job_title}</Table.Td>
                      <Table.Td>{o.employee.country_name}</Table.Td>
                      <Table.Td ta="right">{formatMoney(o.employee.salary, o.employee.currency)}</Table.Td>
                      <Table.Td ta="right">
                        {formatMoney(o.peer_median, o.employee.currency)}
                        <Text size="xs" c="dimmed">{o.peer_count} peers</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Badge color={o.direction === 'below' ? 'red' : 'orange'} variant="light">
                          {formatCompaGap(o.compa_ratio)} {o.direction}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        </>
      )}
    </Stack>
  )
}
