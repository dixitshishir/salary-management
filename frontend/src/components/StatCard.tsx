import { Paper, Text } from '@mantine/core'

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Paper withBorder p="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
      <Text fz={26} fw={700} mt={4}>
        {value}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed" mt={2}>
          {hint}
        </Text>
      )}
    </Paper>
  )
}
