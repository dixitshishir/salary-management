import { Badge, Button, Drawer, Group, Loader, SimpleGrid, Stack, Text, Timeline, Title } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '../api/employees'
import type { Employee } from '../api/types'
import { formatDate, formatEmploymentType, formatMoney } from '../lib/format'

interface Props {
  employeeId: number
  onClose: () => void
  onEdit: (employee: Employee) => void
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </div>
  )
}

export function EmployeeDrawer({ employeeId, onClose, onEdit }: Props) {
  const queryClient = useQueryClient()
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesApi.get(employeeId),
  })

  const remove = useMutation({
    mutationFn: () => employeesApi.remove(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['insights'] })
      notifications.show({ color: 'green', message: 'Employee removed' })
      onClose()
    },
  })

  const confirmRemove = () =>
    modals.openConfirmModal({
      title: `Remove ${employee?.full_name}?`,
      children: <Text size="sm">This deletes the employee and their salary history. It can't be undone.</Text>,
      labels: { confirm: 'Remove', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove.mutate(),
    })

  return (
    <Drawer opened onClose={onClose} position="right" size="md" title={employee?.employee_code ?? 'Employee'}>
      {isLoading || !employee ? (
        <Loader />
      ) : (
        <Stack>
          <div>
            <Title order={3}>{employee.full_name}</Title>
            <Text c="dimmed">
              {employee.job_title} · {employee.department}
            </Text>
          </div>
          <Group gap="xs">
            <Badge variant="light">{employee.country_name}</Badge>
            <Badge variant="light" color="gray">
              {formatEmploymentType(employee.employment_type)}
            </Badge>
          </Group>
          <SimpleGrid cols={2}>
            <Field label="Annual salary" value={formatMoney(employee.salary, employee.currency)} />
            <Field label="In USD" value={formatMoney(employee.salary_usd, 'USD')} />
            <Field label="Email" value={employee.email} />
            <Field label="Hire date" value={formatDate(employee.hire_date)} />
          </SimpleGrid>

          <Title order={5} mt="sm">
            Salary history
          </Title>
          {employee.salary_revisions.length === 0 ? (
            <Text size="sm" c="dimmed">
              No changes recorded.
            </Text>
          ) : (
            <Timeline bulletSize={14} lineWidth={2}>
              {employee.salary_revisions.map((revision) => (
                <Timeline.Item
                  key={revision.id}
                  title={
                    revision.previous_salary === null
                      ? `Started at ${formatMoney(revision.new_salary, employee.currency)}`
                      : `${formatMoney(revision.previous_salary, employee.currency)} → ${formatMoney(revision.new_salary, employee.currency)}`
                  }
                >
                  <Text size="xs" c="dimmed">
                    {formatDate(revision.created_at)}
                    {revision.reason ? ` · ${revision.reason}` : ''}
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          )}

          <Group mt="md">
            <Button onClick={() => onEdit(employee)}>Edit</Button>
            <Button variant="light" color="red" onClick={confirmRemove} loading={remove.isPending}>
              Remove
            </Button>
          </Group>
        </Stack>
      )}
    </Drawer>
  )
}
