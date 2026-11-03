import { BarChart } from '@mantine/charts'
import { Alert, Group, Loader, Paper, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { insightsApi } from '../api/insights'
import { StatCard } from '../components/StatCard'
import { formatCompactUsd, formatCount, formatDate, formatMoney } from '../lib/format'

export function InsightsPage() {
  const overview = useQuery({ queryKey: ['insights', 'overview'], queryFn: insightsApi.overview })
  const countries = useQuery({ queryKey: ['insights', 'countries'], queryFn: insightsApi.countries })
  const [pickedCountry, setPickedCountry] = useState<string | null>(null)
  // Default to the largest country so the job-title table is never empty on first view.
  const countryCode = pickedCountry ?? countries.data?.[0]?.country_code ?? null
  const jobTitles = useQuery({
    queryKey: ['insights', 'job_titles', countryCode],
    queryFn: () => insightsApi.jobTitles(countryCode!),
    enabled: countryCode !== null,
  })

  if (overview.isError || countries.isError) return <Alert color="red">Could not load insights.</Alert>
  if (!overview.data || !countries.data) return <Loader />

  const o = overview.data
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Pay insights</Title>
        <Text c="dimmed" size="sm">
          Salaries are annual base pay. USD figures use fixed rates as of {formatDate(o.rates_as_of)}.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <StatCard label="Headcount" value={formatCount(o.headcount)} />
        <StatCard label="Countries" value={String(o.country_count)} />
        <StatCard label="Annual payroll" value={formatCompactUsd(o.total_payroll_usd)} hint="All countries, in USD" />
        <StatCard label="Median salary" value={formatMoney(o.median_salary_usd, 'USD')} hint={`Mean ${formatMoney(o.mean_salary_usd, 'USD')}`} />
      </SimpleGrid>

      <Paper withBorder p="md">
        <Title order={4} mb="md">
          Median salary by country (USD)
        </Title>
        <BarChart
          h={260}
          data={countries.data.map((c) => ({ country: c.country_name, median: c.median_usd }))}
          dataKey="country"
          series={[{ name: 'median', label: 'Median salary', color: 'indigo.6' }]}
          valueFormatter={(value) => formatMoney(value, 'USD')}
          tickLine="y"
        />
      </Paper>

      <Paper withBorder p="md">
        <Title order={4} mb="xs">
          Salary by country (local currency)
        </Title>
        <Table.ScrollContainer minWidth={800}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <Table.Th ta="right">Headcount</Table.Th>
                <Table.Th ta="right">Min</Table.Th>
                <Table.Th ta="right">Median</Table.Th>
                <Table.Th ta="right">Mean</Table.Th>
                <Table.Th ta="right">Max</Table.Th>
                <Table.Th ta="right">Median (USD)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {countries.data.map((c) => (
                <Table.Tr key={c.country_code}>
                  <Table.Td>{c.country_name}</Table.Td>
                  <Table.Td ta="right">{formatCount(c.headcount)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(c.min, c.currency)}</Table.Td>
                  <Table.Td ta="right" fw={600}>{formatMoney(c.median, c.currency)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(c.mean, c.currency)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(c.max, c.currency)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(c.median_usd, 'USD')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Paper withBorder p="md">
        <Group justify="space-between" mb="xs">
          <Title order={4}>Salary by job title</Title>
          <Select
            aria-label="Country for job titles"
            data={countries.data.map((c) => ({ value: c.country_code, label: c.country_name }))}
            value={countryCode}
            onChange={setPickedCountry}
            allowDeselect={false}
            w={220}
          />
        </Group>
        {jobTitles.data ? (
          <Table.ScrollContainer minWidth={800}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Job title</Table.Th>
                  <Table.Th ta="right">Headcount</Table.Th>
                  <Table.Th ta="right">Min</Table.Th>
                  <Table.Th ta="right">25th pct</Table.Th>
                  <Table.Th ta="right">Median</Table.Th>
                  <Table.Th ta="right">75th pct</Table.Th>
                  <Table.Th ta="right">Max</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {jobTitles.data.job_titles.map((row) => (
                  <Table.Tr key={row.job_title}>
                    <Table.Td>{row.job_title}</Table.Td>
                    <Table.Td ta="right">{formatCount(row.headcount)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.min, jobTitles.data.currency)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.p25, jobTitles.data.currency)}</Table.Td>
                    <Table.Td ta="right" fw={600}>{formatMoney(row.median, jobTitles.data.currency)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.p75, jobTitles.data.currency)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.max, jobTitles.data.currency)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Loader size="sm" />
        )}
      </Paper>

      <Paper withBorder p="md">
        <Title order={4} mb="xs">
          Payroll by department (USD)
        </Title>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Department</Table.Th>
              <Table.Th ta="right">Headcount</Table.Th>
              <Table.Th ta="right">Annual payroll</Table.Th>
              <Table.Th ta="right">Median salary</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {o.departments.map((d) => (
              <Table.Tr key={d.department}>
                <Table.Td>{d.department}</Table.Td>
                <Table.Td ta="right">{formatCount(d.headcount)}</Table.Td>
                <Table.Td ta="right">{formatCompactUsd(d.total_payroll_usd)}</Table.Td>
                <Table.Td ta="right">{formatMoney(d.median_salary_usd, 'USD')}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}
