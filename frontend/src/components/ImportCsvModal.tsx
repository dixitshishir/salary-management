import { Alert, Button, FileInput, Group, Modal, Stack, Table, Text } from '@mantine/core'
import { IconFileTypeCsv } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { employeesApi } from '../api/employees'

const MAX_ERRORS_SHOWN = 50

export function ImportCsvModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)

  const upload = useMutation({
    mutationFn: (csv: File) => employeesApi.import(csv),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['insights'] })
      queryClient.invalidateQueries({ queryKey: ['reference'] })
    },
  })
  const result = upload.data

  return (
    <Modal opened onClose={onClose} title="Import employees from CSV" size="lg">
      <Stack>
        <Text size="sm" c="dimmed">
          Use the same columns as Export. Rows with an existing employee code update that employee (salary changes are
          logged as "CSV import"); rows with a new or blank code create one.
        </Text>
        <FileInput
          label="CSV file"
          accept=".csv,text/csv"
          leftSection={<IconFileTypeCsv size={18} />}
          value={file}
          onChange={setFile}
          clearable
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
          <Button disabled={!file} loading={upload.isPending} onClick={() => file && upload.mutate(file)}>
            Import
          </Button>
        </Group>

        {upload.isError && <Alert color="red">{upload.error.message}</Alert>}
        {result && (
          <Alert color={result.errors.length ? 'yellow' : 'green'} title="Import finished">
            {result.created} created · {result.updated} updated · {result.unchanged} unchanged · {result.errors.length}{' '}
            rows with errors
          </Alert>
        )}
        {result && result.errors.length > 0 && (
          <Table striped withTableBorder fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Line</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Problem</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {result.errors.slice(0, MAX_ERRORS_SHOWN).map((error) => (
                <Table.Tr key={error.line}>
                  <Table.Td>{error.line}</Table.Td>
                  <Table.Td>{error.employee_code ?? '—'}</Table.Td>
                  <Table.Td>{error.messages.join('; ')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Modal>
  )
}
