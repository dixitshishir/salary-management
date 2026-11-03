import { Alert, Autocomplete, Button, Group, Modal, NumberInput, Select, SimpleGrid, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError, type FieldErrors } from '../api/client'
import { employeesApi } from '../api/employees'
import { referenceOptions, useReference } from '../api/hooks'
import type { Employee, EmployeeInput } from '../api/types'
import { formatEmploymentType } from '../lib/format'

interface Props {
  /** The employee being edited, or null to create a new one. */
  employee: Employee | null
  onClose: () => void
}

const EMPTY: EmployeeInput = {
  first_name: '',
  last_name: '',
  email: '',
  job_title: '',
  department: '',
  country_code: '',
  salary: '',
  employment_type: 'full_time',
  hire_date: '',
}

function toInput(employee: Employee | null): EmployeeInput {
  if (!employee) return EMPTY
  const { first_name, last_name, email, job_title, department, country_code, salary, employment_type, hire_date } = employee
  return { first_name, last_name, email, job_title, department, country_code, salary, employment_type, hire_date }
}

// Validation rules live in the Rails model; this form shows the server's
// field errors instead of duplicating the rules in TypeScript.
export function EmployeeFormModal({ employee, onClose }: Props) {
  const queryClient = useQueryClient()
  const { data: reference } = useReference()
  const options = referenceOptions(reference)
  const [values, setValues] = useState<EmployeeInput>(() => toInput(employee))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const salaryChanged = employee !== null && values.salary !== employee.salary
  const currency = reference?.countries.find((c) => c.code === values.country_code)?.currency

  const save = useMutation({
    mutationFn: (input: EmployeeInput) => (employee ? employeesApi.update(employee.id, input) : employeesApi.create(input)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', saved.id] })
      queryClient.invalidateQueries({ queryKey: ['insights'] })
      queryClient.invalidateQueries({ queryKey: ['reference'] })
      notifications.show({ color: 'green', message: `${saved.full_name} saved` })
      onClose()
    },
    onError: (error) => {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors)
        setFormError(null)
      } else {
        setFormError(error.message)
      }
    },
  })

  const set = <K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) =>
    setValues((current) => ({ ...current, [key]: value }))
  const errorFor = (key: string) => errors[key]?.join(', ')

  return (
    <Modal opened onClose={onClose} title={employee ? `Edit ${employee.full_name}` : 'Add employee'} size="lg">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate(values)
        }}
      >
        {formError && (
          <Alert color="red" mb="md">
            {formError}
          </Alert>
        )}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="First name" value={values.first_name} onChange={(e) => set('first_name', e.currentTarget.value)} error={errorFor('first_name')} required />
          <TextInput label="Last name" value={values.last_name} onChange={(e) => set('last_name', e.currentTarget.value)} error={errorFor('last_name')} required />
          <TextInput label="Email" type="email" value={values.email} onChange={(e) => set('email', e.currentTarget.value)} error={errorFor('email')} required />
          <Select
            label="Employment type"
            data={(reference?.employment_types ?? ['full_time', 'part_time', 'contract']).map((t) => ({ value: t, label: formatEmploymentType(t) }))}
            value={values.employment_type}
            onChange={(value) => value && set('employment_type', value as EmployeeInput['employment_type'])}
            error={errorFor('employment_type')}
            allowDeselect={false}
          />
          <Autocomplete label="Job title" data={options.jobTitles} value={values.job_title} onChange={(v) => set('job_title', v)} error={errorFor('job_title')} required />
          <Autocomplete label="Department" data={options.departments} value={values.department} onChange={(v) => set('department', v)} error={errorFor('department')} required />
          <Select label="Country" data={options.countries} value={values.country_code || null} onChange={(v) => set('country_code', v ?? '')} error={errorFor('country_code')} searchable required />
          <NumberInput
            label={`Annual salary${currency ? ` (${currency})` : ''}`}
            value={values.salary}
            onChange={(v) => set('salary', typeof v === 'number' ? v : '')}
            error={errorFor('salary')}
            thousandSeparator=","
            allowDecimal={false}
            allowNegative={false}
            required
          />
          <TextInput label="Hire date" type="date" value={values.hire_date} onChange={(e) => set('hire_date', e.currentTarget.value)} error={errorFor('hire_date')} required />
          {salaryChanged && (
            <TextInput
              label="Reason for salary change"
              placeholder="e.g. Annual review, promotion"
              value={values.salary_change_reason ?? ''}
              onChange={(e) => set('salary_change_reason', e.currentTarget.value)}
            />
          )}
        </SimpleGrid>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {employee ? 'Save changes' : 'Add employee'}
          </Button>
        </Group>
      </form>
    </Modal>
  )
}
