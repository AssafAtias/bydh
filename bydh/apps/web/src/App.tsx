import HouseSidingIcon from '@mui/icons-material/HouseSiding'
import PaidIcon from '@mui/icons-material/Paid'
import SavingsIcon from '@mui/icons-material/Savings'
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BuildHouseSection } from './sections/BuildHouseSection'
import { ExpensesSection } from './sections/ExpensesSection'
import { InvestmentsIncomeSection } from './sections/InvestmentsIncomeSection'
import { useI18n } from './lib/i18n'
import { ScenariosSection } from './sections/ScenariosSection'
import { getBuildData, getFinanceData, getScenarios } from './api/dashboard'

function App() {
  const { locale, setLocale, t } = useI18n()
  const menu = useMemo(
    () =>
      [
        { key: 'investments', label: t('tabInvestments'), icon: <SavingsIcon fontSize="small" /> },
        { key: 'expenses', label: t('tabExpenses'), icon: <PaidIcon fontSize="small" /> },
        { key: 'build', label: t('tabBuild'), icon: <HouseSidingIcon fontSize="small" /> },
      ] as const,
    [t],
  )
  const [tab, setTab] = useState<(typeof menu)[number]['key']>('investments')

  const financeQuery = useQuery({ queryKey: ['finances'], queryFn: getFinanceData })
  const buildQuery = useQuery({ queryKey: ['build'], queryFn: getBuildData })
  const scenarioQuery = useQuery({ queryKey: ['scenarios'], queryFn: getScenarios })

  const isLoading = financeQuery.isLoading || buildQuery.isLoading || scenarioQuery.isLoading
  const hasError = financeQuery.isError || buildQuery.isError || scenarioQuery.isError

  const sectionTitle = useMemo(() => {
    switch (tab) {
      case 'expenses':
        return t('tabDescExpenses')
      case 'build':
        return t('tabDescBuild')
      default:
        return t('tabDescInvestments')
    }
  }, [tab, t])

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar>
          <Typography
            fontWeight={800}
            sx={{
              background: 'linear-gradient(110deg, #0f766e 0%, #7c3aed 95%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('appName')}
          </Typography>
          <Stack direction="row" spacing={1} ml="auto">
            <Button size="small" variant={locale === 'he' ? 'contained' : 'outlined'} onClick={() => setLocale('he')}>
              {t('langHebrew')}
            </Button>
            <Button size="small" variant={locale === 'en' ? 'contained' : 'outlined'} onClick={() => setLocale('en')}>
              {t('langEnglish')}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Stack spacing={3}>
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background:
                'linear-gradient(140deg, rgba(255, 255, 255, 0.85), rgba(236, 253, 245, 0.75) 40%, rgba(243, 232, 255, 0.68))',
              boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
            }}
          >
            <Typography variant="h4" fontWeight={800} fontSize={{ xs: '1.8rem', md: '2.25rem' }}>
              {t('heroTitle')}
            </Typography>
            <Typography mt={1} color="text.secondary">
              {t('heroSubtitle')}
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, value: (typeof menu)[number]['key']) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              p: 0.75,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'rgba(255,255,255,0.8)',
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            {menu.map((item) => (
              <Tab
                key={item.key}
                value={item.key}
                icon={item.icon}
                iconPosition="start"
                label={item.label}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  minHeight: 40,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.dark',
                    background: 'linear-gradient(120deg, rgba(45, 212, 191, 0.22), rgba(167, 139, 250, 0.2))',
                  },
                }}
              />
            ))}
          </Tabs>

          <Typography color="text.secondary">{sectionTitle}</Typography>

          {isLoading ? (
            <Stack alignItems="center" py={8}>
              <CircularProgress />
            </Stack>
          ) : null}

          {hasError ? (
            <Alert severity="error">{t('apiError')}</Alert>
          ) : null}

          {!isLoading && !hasError && financeQuery.data && buildQuery.data && scenarioQuery.data ? (
            <Stack spacing={2.5}>
              {tab === 'investments' ? <InvestmentsIncomeSection finance={financeQuery.data} /> : null}
              {tab === 'expenses' ? <ExpensesSection finance={financeQuery.data} /> : null}
              {tab === 'build' ? <BuildHouseSection builds={buildQuery.data} /> : null}

              <Box>
                <Typography variant="h6" fontWeight={700} mb={1.5}>
                  {t('scenariosTitle')}
                </Typography>
                <ScenariosSection scenarios={scenarioQuery.data} />
              </Box>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  )
}

export default App
