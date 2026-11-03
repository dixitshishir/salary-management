import { Alert, Button, Group, Pagination, Paper, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconDownload, IconPlus, IconSearch, IconUpload } from '@tabler/icons-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { employeesApi } from '../api/employees'
import { referenceOptions, useReference } from '../api/hooks'
import type { Employee, EmployeeFilters } from '../api/types'
import { EmployeeDrawer } from '../components/EmployeeDrawer'
import { EmployeeFormModal } from '../components/EmployeeFormModal'
import { ImportCsvModal } from '../components/ImportCsvModal'
import { SortableHeader } from '../components/SortableHeader'
import { formatCount, formatMoney } from '../lib/format'

const PER_PAGE = 25

type Editing = { employee: Employee | null } | null

export function EmployeesPage() {
  const [filters, setFilters] = useState<EmployeeFilters>({ page: 1, sort: 'employee_code', direction: 'asc' })
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [editing, setEditing] = useState<Editing>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)

  const query: EmployeeFilters = { ...filters, q: debouncedSearch, per_page: PER_PAGE }
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['employees', query],
    queryFn: () => employeesApi.list(query),
    placeholderData: keepPreviousData,
  })
  const options = referenceOptions(useReference().data)

  // Any filter change returns to page 1, so you never land on an empty page.
  const updateFilter = (patch: Partial<EmployeeFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 }))
  const toggleSort = (column: string) =>
    setFilters((f) => ({
      ...f,
      sort: column,
      direction: f.sort === column && f.direction === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  const sortProps = { sort: filters.sort, direction: filters.direction, onSort: toggleSort }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Employees</Title>
          <Text c="dimmed" size="sm">
            {data ? `${formatCount(data.meta.total_count)} employees` : 'Loading…'}
          </Text>
        </div>
        <Group>
          <Button variant="default" leftSection={<IconUpload size={16} />} onClick={() => setImporting(true)}>
            Import CSV
          </Button>
          <Button
            variant="default"
            leftSection={<IconDownload size={16} />}
            component="a"
            href={employeesApi.exportUrl({ ...filters, q: debouncedSearch })}
          >
            Export CSV
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setEditing({ employee: null })}>
            Add employee
          </Button>
        </Group>
      </Group>

      <Group grow align="flex-end">
        <TextInput
          aria-label="Search employees"
          placeholder="Search by name, email or code"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value)
            setFilters((f) => ({ ...f, page: 1 }))
          }}
        />
        <Select aria-label="Country" placeholder="All countries" data={options.countries} value={filters.country_code ?? null} onChange={(v) => updateFilter({ country_code: v ?? undefined })} clearable searchable />
        <Select aria-label="Department" placeholder="All departments" data={options.departments} value={filters.department ?? null} onChange={(v) => updateFilter({ department: v ?? undefined })} clearable searchable />
        <Select aria-label="Job title" placeholder="All job titles" data={options.jobTitles} value={filters.job_title ?? null} onChange={(v) => updateFilter({ job_title: v ?? undefined })} clearable searchable />
      </Group>

      {isError && <Alert color="red">{error.message}</Alert>}

      <Paper withBorder style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 150ms' }}>
        <Table.ScrollContainer minWidth={900}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <SortableHeader column="employee_code" {...sortProps}>Code</SortableHeader>
                <SortableHeader column="name" {...sortProps}>Name</SortableHeader>
                <SortableHeader column="job_title" {...sortProps}>Job title</SortableHeader>
                <SortableHeader column="department" {...sortProps}>Department</SortableHeader>
                <SortableHeader column="country_code" {...sortProps}>Country</SortableHeader>
                <SortableHeader column="salary" align="right" {...sortProps}>Annual salary</SortableHeader>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data?.data.map((employee) => (
                <Table.Tr key={employee.id} onClick={() => setSelectedId(employee.id)} style={{ cursor: 'pointer' }}>
                  <Table.Td>
                    <Text size="sm" ff="monospace">
                      {employee.employee_code}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {employee.full_name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {employee.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>{employee.job_title}</Table.Td>
                  <Table.Td>{employee.department}</Table.Td>
                  <Table.Td>{employee.country_name}</Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm">{formatMoney(employee.salary, employee.currency)}</Text>
                    {employee.currency !== 'USD' && (
                      <Text size="xs" c="dimmed">
                        ≈ {formatMoney(employee.salary_usd, 'USD')}
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
              {data && data.data.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="lg">
                      No employees match these filters.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {data && data.meta.total_pages > 1 && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Page {data.meta.page} of {formatCount(data.meta.total_pages)}
          </Text>
          <Pagination
            total={data.meta.total_pages}
            value={data.meta.page}
            onChange={(page) => setFilters((f) => ({ ...f, page }))}
            siblings={1}
          />
        </Group>
      )}

      {selectedId !== null && (
        <EmployeeDrawer
          employeeId={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={(employee) => setEditing({ employee })}
        />
      )}
      {editing && <EmployeeFormModal employee={editing.employee} onClose={() => setEditing(null)} />}
      {importing && <ImportCsvModal onClose={() => setImporting(false)} />}
    </Stack>
  )
}
