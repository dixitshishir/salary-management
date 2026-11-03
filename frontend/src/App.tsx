import { AppShell, Burger, Group, NavLink, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconAlertTriangle, IconCalculator, IconChartBar, IconUsers } from '@tabler/icons-react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { EmployeesPage } from './pages/EmployeesPage'
import { InsightsPage } from './pages/InsightsPage'
import { OutliersPage } from './pages/OutliersPage'
import { RaisePlannerPage } from './pages/RaisePlannerPage'

const NAV = [
  { path: '/employees', label: 'Employees', icon: IconUsers },
  { path: '/insights', label: 'Pay insights', icon: IconChartBar },
  { path: '/outliers', label: 'Pay outliers', icon: IconAlertTriangle },
  { path: '/raise-planner', label: 'Raise planner', icon: IconCalculator },
]

export function App() {
  const [opened, { toggle, close }] = useDisclosure()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 230, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
          <Title order={3}>ACME Salary Manager</Title>
          <Text c="dimmed" size="sm" visibleFrom="sm">
            HR workspace
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {NAV.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            label={label}
            leftSection={<Icon size={18} stroke={1.6} />}
            active={location.pathname.startsWith(path)}
            onClick={() => {
              navigate(path)
              close()
            }}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/outliers" element={<OutliersPage />} />
          <Route path="/raise-planner" element={<RaisePlannerPage />} />
          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}
