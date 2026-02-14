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
  MenuItem,
  Stack,
  TextField,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BuildHouseSection } from './sections/BuildHouseSection'
import { ExpensesSection } from './sections/ExpensesSection'
import { InvestmentsIncomeSection } from './sections/InvestmentsIncomeSection'
import { useI18n } from './lib/i18n'
import { ScenariosSection } from './sections/ScenariosSection'
import {
  clearAuthToken,
  createProfile,
  getAuthToken,
  getBuildData,
  getFinanceData,
  getMe,
  getProfiles,
  getScenarios,
  login,
  register,
  setAuthToken,
} from './api/dashboard'

const PROFILE_STORAGE_KEY = 'bydh_active_profile_id'

function App() {
  const { locale, setLocale, t } = useI18n()
  const queryClient = useQueryClient()
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [selectedProfileId, setSelectedProfileId] = useState<string>(() => localStorage.getItem(PROFILE_STORAGE_KEY) ?? '')
  const [newProfileName, setNewProfileName] = useState('')

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: Boolean(getAuthToken()),
    retry: false,
  })
  const isAuthenticated = Boolean(meQuery.data)

  const profilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
    enabled: isAuthenticated,
  })
  const financeQuery = useQuery({
    queryKey: ['finances', selectedProfileId],
    queryFn: () => getFinanceData(selectedProfileId),
    enabled: isAuthenticated && Boolean(selectedProfileId),
  })
  const buildQuery = useQuery({ queryKey: ['build'], queryFn: getBuildData, enabled: isAuthenticated })
  const scenarioQuery = useQuery({
    queryKey: ['scenarios', selectedProfileId],
    queryFn: () => getScenarios(selectedProfileId),
    enabled: isAuthenticated && Boolean(selectedProfileId),
  })
  const loginMutation = useMutation({ mutationFn: login })
  const registerMutation = useMutation({ mutationFn: register })
  const createProfileMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: (createdProfile) => {
      setSelectedProfileId(createdProfile.id)
      localStorage.setItem(PROFILE_STORAGE_KEY, createdProfile.id)
      setNewProfileName('')
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })

  useEffect(() => {
    if (meQuery.isError && getAuthToken()) {
      clearAuthToken()
      localStorage.removeItem(PROFILE_STORAGE_KEY)
      setSelectedProfileId('')
    }
  }, [meQuery.isError])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const profiles = profilesQuery.data ?? []
    if (profiles.length === 0) {
      if (selectedProfileId) {
        setSelectedProfileId('')
        localStorage.removeItem(PROFILE_STORAGE_KEY)
      }
      return
    }

    if (profiles.some((profile) => profile.id === selectedProfileId)) {
      return
    }

    setSelectedProfileId(profiles[0].id)
    localStorage.setItem(PROFILE_STORAGE_KEY, profiles[0].id)
  }, [isAuthenticated, profilesQuery.data, selectedProfileId])

  const submitAuth = () => {
    if (authMode === 'login') {
      loginMutation.mutate(
        {
          email: authForm.email.trim(),
          password: authForm.password,
        },
        {
          onSuccess: ({ token }) => {
            setAuthToken(token)
            setAuthForm((prev) => ({ ...prev, password: '' }))
            queryClient.invalidateQueries({ queryKey: ['me'] })
          },
        },
      )
      return
    }

    registerMutation.mutate(
      {
        name: authForm.name.trim(),
        email: authForm.email.trim(),
        password: authForm.password,
      },
      {
        onSuccess: ({ token }) => {
          setAuthToken(token)
          setAuthForm((prev) => ({ ...prev, password: '' }))
          queryClient.invalidateQueries({ queryKey: ['me'] })
        },
      },
    )
  }

  const logout = () => {
    clearAuthToken()
    localStorage.removeItem(PROFILE_STORAGE_KEY)
    setSelectedProfileId('')
    queryClient.clear()
  }

  const isLoading =
    meQuery.isLoading || profilesQuery.isLoading || buildQuery.isLoading || scenarioQuery.isLoading || financeQuery.isLoading
  const hasError = profilesQuery.isError || buildQuery.isError || scenarioQuery.isError || financeQuery.isError

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
            {isAuthenticated ? (
              <Button size="small" color="inherit" onClick={logout}>
                {t('authLogout')}
              </Button>
            ) : null}
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
        {!isAuthenticated ? (
          <Stack spacing={2} maxWidth={460} mx="auto" mt={8}>
            <Typography variant="h5" fontWeight={800}>
              {authMode === 'login' ? t('authLoginTitle') : t('authRegisterTitle')}
            </Typography>
            <TextField
              label={t('authEmail')}
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            {authMode === 'register' ? (
              <TextField
                label={t('authName')}
                value={authForm.name}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            ) : null}
            <TextField
              label={t('authPassword')}
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <Button
              variant="contained"
              onClick={submitAuth}
              disabled={
                loginMutation.isPending ||
                registerMutation.isPending ||
                !authForm.email.trim() ||
                !authForm.password ||
                (authMode === 'register' && !authForm.name.trim())
              }
            >
              {authMode === 'login' ? t('authLoginButton') : t('authRegisterButton')}
            </Button>
            {(loginMutation.isError || registerMutation.isError) && (
              <Alert severity="error">{t('authError')}</Alert>
            )}
            <Button
              onClick={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}
              color="inherit"
              sx={{ alignSelf: 'flex-start' }}
            >
              {authMode === 'login' ? t('authSwitchToRegister') : t('authSwitchToLogin')}
            </Button>
          </Stack>
        ) : (
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
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} mt={2}>
              <TextField
                select
                size="small"
                label={t('profileLabel')}
                value={selectedProfileId}
                onChange={(event) => {
                  setSelectedProfileId(event.target.value)
                  localStorage.setItem(PROFILE_STORAGE_KEY, event.target.value)
                }}
                sx={{ minWidth: { md: 280 } }}
              >
                {(profilesQuery.data ?? []).map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.familyName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label={t('profileNewLabel')}
                value={newProfileName}
                onChange={(event) => setNewProfileName(event.target.value)}
              />
              <Button
                variant="contained"
                disabled={createProfileMutation.isPending || !newProfileName.trim()}
                onClick={() =>
                  createProfileMutation.mutate({
                    familyName: newProfileName.trim(),
                  })
                }
              >
                {t('profileCreate')}
              </Button>
            </Stack>
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

          {!isLoading && !hasError && (profilesQuery.data?.length ?? 0) === 0 ? (
            <Alert severity="info">{t('profileEmptyState')}</Alert>
          ) : null}

          {!isLoading &&
          !hasError &&
          financeQuery.data &&
          buildQuery.data &&
          scenarioQuery.data &&
          selectedProfileId ? (
            <Stack spacing={2.5}>
              {tab === 'investments' ? (
                <InvestmentsIncomeSection finance={financeQuery.data} profileId={selectedProfileId} />
              ) : null}
              {tab === 'expenses' ? <ExpensesSection finance={financeQuery.data} profileId={selectedProfileId} /> : null}
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
        )}
      </Container>
    </Box>
  )
}

export default App
