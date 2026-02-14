import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardContent, Divider, Grid, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  createIncome,
  createIncomeType,
  createInvestment,
  deleteIncomeType,
  deleteIncome,
  deleteInvestment,
  updateIncomeType,
  updateIncome,
  updateInvestment,
} from '../api/dashboard'
import type { FamilyFinance } from '../api/dashboard'
import { MetricCard } from '../components/MetricCard'
import { useI18n } from '../lib/i18n'
import { toCurrency } from '../lib/format'

interface Props {
  finance: FamilyFinance
  profileId: string
}

export function InvestmentsIncomeSection({ finance, profileId }: Props) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [incomeDrafts, setIncomeDrafts] = useState<Record<string, { name: string; typeId: string; monthlyIls: string }>>({})
  const [investmentDrafts, setInvestmentDrafts] = useState<
    Record<string, { name: string; accountType: string; provider: string; currentValueIls: string; yearlyDepositIls: string }>
  >({})

  const [incomeTypeDrafts, setIncomeTypeDrafts] = useState<Record<string, string>>({})
  const [newIncomeTypeLabel, setNewIncomeTypeLabel] = useState('')
  const [newIncome, setNewIncome] = useState({ name: '', typeId: '', monthlyIls: '' })
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    accountType: '',
    provider: '',
    currentValueIls: '',
    yearlyDepositIls: '',
  })
  useEffect(() => {
    if (!newIncome.typeId && finance.incomeTypes[0]?.id) {
      setNewIncome((prev) => ({ ...prev, typeId: finance.incomeTypes[0].id }))
    }
  }, [finance.incomeTypes, newIncome.typeId])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['finances'] })
  const createIncomeMutation = useMutation({ mutationFn: createIncome, onSuccess: refresh })
  const updateIncomeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; typeId: string; monthlyIls: number } }) => updateIncome(id, data),
    onSuccess: refresh,
  })
  const deleteIncomeMutation = useMutation({ mutationFn: deleteIncome, onSuccess: refresh })
  const createIncomeTypeMutation = useMutation({ mutationFn: createIncomeType, onSuccess: refresh })
  const updateIncomeTypeMutation = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) => updateIncomeType(id, { label }),
    onSuccess: refresh,
  })
  const deleteIncomeTypeMutation = useMutation({ mutationFn: deleteIncomeType, onSuccess: refresh })

  const createInvestmentMutation = useMutation({ mutationFn: createInvestment, onSuccess: refresh })
  const updateInvestmentMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name: string; accountType: string; provider?: string; currentValueIls: number; yearlyDepositIls?: number | null }
    }) => updateInvestment(id, data),
    onSuccess: refresh,
  })
  const deleteInvestmentMutation = useMutation({ mutationFn: deleteInvestment, onSuccess: refresh })

  const isBusy =
    createIncomeMutation.isPending ||
    updateIncomeMutation.isPending ||
    deleteIncomeMutation.isPending ||
    createIncomeTypeMutation.isPending ||
    updateIncomeTypeMutation.isPending ||
    deleteIncomeTypeMutation.isPending ||
    createInvestmentMutation.isPending ||
    updateInvestmentMutation.isPending ||
    deleteInvestmentMutation.isPending

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard label={t('metricMonthlyIncome')} value={toCurrency(finance.totals.monthlyIncome)} accent="income" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label={t('metricMonthlyExpenses')}
            value={toCurrency(finance.totals.monthlyExpenses)}
            accent="expenses"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard label={t('metricNetMonthly')} value={toCurrency(finance.totals.netMonthly)} accent="net" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label={t('metricInvestmentTotal')}
            value={toCurrency(finance.totals.investmentsTotal)}
            accent="investments"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                {t('incomeTitle')}
              </Typography>
              <Stack mt={2} spacing={1.5}>
                {finance.incomes.map((income) => (
                  <Stack key={income.id} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      label={t('fieldName')}
                      value={incomeDrafts[income.id]?.name ?? income.name}
                      onChange={(event) =>
                        setIncomeDrafts((prev) => ({
                          ...prev,
                          [income.id]: {
                            name: event.target.value,
                            typeId: prev[income.id]?.typeId ?? (income.typeId ?? ''),
                            monthlyIls: prev[income.id]?.monthlyIls ?? String(income.monthlyIls),
                          },
                        }))
                      }
                    />
                    <TextField
                      select
                      size="small"
                      label={t('fieldType')}
                      value={incomeDrafts[income.id]?.typeId ?? (income.typeId ?? '')}
                      onChange={(event) =>
                        setIncomeDrafts((prev) => ({
                          ...prev,
                          [income.id]: {
                            name: prev[income.id]?.name ?? income.name,
                            typeId: event.target.value,
                            monthlyIls: prev[income.id]?.monthlyIls ?? String(income.monthlyIls),
                          },
                        }))
                      }
                    >
                      {!income.typeId ? (
                        <MenuItem value="">
                          {income.type}
                        </MenuItem>
                      ) : null}
                      {finance.incomeTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      label={t('fieldMonthlyIls')}
                      type="number"
                      value={incomeDrafts[income.id]?.monthlyIls ?? String(income.monthlyIls)}
                      onChange={(event) =>
                        setIncomeDrafts((prev) => ({
                          ...prev,
                          [income.id]: {
                            name: prev[income.id]?.name ?? income.name,
                            typeId: prev[income.id]?.typeId ?? (income.typeId ?? ''),
                            monthlyIls: event.target.value,
                          },
                        }))
                      }
                    />
                    <IconButton
                      color="primary"
                      onClick={() =>
                        updateIncomeMutation.mutate({
                          id: income.id,
                          data: {
                            name: incomeDrafts[income.id]?.name ?? income.name,
                            typeId: incomeDrafts[income.id]?.typeId ?? (income.typeId ?? ''),
                            monthlyIls: Number(incomeDrafts[income.id]?.monthlyIls ?? income.monthlyIls),
                          },
                        })
                      }
                      disabled={isBusy}
                    >
                      <SaveOutlinedIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => deleteIncomeMutation.mutate(income.id)} disabled={isBusy}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                ))}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    label={t('fieldName')}
                    value={newIncome.name}
                    onChange={(event) => setNewIncome((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <TextField
                  select
                    size="small"
                    label={t('fieldType')}
                  value={newIncome.typeId}
                  onChange={(event) => setNewIncome((prev) => ({ ...prev, typeId: event.target.value }))}
                >
                  {finance.incomeTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
                  <TextField
                    size="small"
                    label={t('fieldMonthlyIls')}
                    type="number"
                    value={newIncome.monthlyIls}
                    onChange={(event) => setNewIncome((prev) => ({ ...prev, monthlyIls: event.target.value }))}
                  />
                  <Button
                    variant="contained"
                    onClick={() =>
                      createIncomeMutation.mutate(
                        {
                          name: newIncome.name.trim(),
                          typeId: newIncome.typeId,
                          monthlyIls: Number(newIncome.monthlyIls),
                          profileId,
                        },
                        {
                          onSuccess: () =>
                            setNewIncome({ name: '', typeId: finance.incomeTypes[0]?.id ?? '', monthlyIls: '' }),
                        },
                      )
                    }
                    disabled={isBusy || !newIncome.name.trim() || !newIncome.monthlyIls || !newIncome.typeId}
                  >
                    {t('buttonAdd')}
                  </Button>
                </Stack>

                <Divider />
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('incomeTypesTitle')}
                </Typography>
                {finance.incomeTypes.map((type) => (
                  <Stack key={type.id} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      label={t('fieldType')}
                      value={incomeTypeDrafts[type.id] ?? type.label}
                      onChange={(event) => setIncomeTypeDrafts((prev) => ({ ...prev, [type.id]: event.target.value }))}
                    />
                    <IconButton
                      color="primary"
                      onClick={() =>
                        updateIncomeTypeMutation.mutate({
                          id: type.id,
                          label: (incomeTypeDrafts[type.id] ?? type.label).trim(),
                        })
                      }
                      disabled={isBusy || !(incomeTypeDrafts[type.id] ?? type.label).trim()}
                    >
                      <SaveOutlinedIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => deleteIncomeTypeMutation.mutate(type.id)} disabled={isBusy}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    label={t('typeNewLabel')}
                    value={newIncomeTypeLabel}
                    onChange={(event) => setNewIncomeTypeLabel(event.target.value)}
                  />
                  <Button
                    variant="contained"
                    onClick={() =>
                      createIncomeTypeMutation.mutate(
                        { label: newIncomeTypeLabel.trim() },
                        { onSuccess: () => setNewIncomeTypeLabel('') },
                      )
                    }
                    disabled={isBusy || !newIncomeTypeLabel.trim()}
                  >
                    {t('buttonAdd')}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                {t('investmentsTitle')}
              </Typography>
              <Stack mt={2} spacing={1.5}>
                {finance.investments.map((investment) => (
                  <Stack key={investment.id} spacing={1}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <TextField
                        size="small"
                        label={t('fieldName')}
                        value={investmentDrafts[investment.id]?.name ?? investment.name}
                        onChange={(event) =>
                          setInvestmentDrafts((prev) => ({
                            ...prev,
                            [investment.id]: {
                              name: event.target.value,
                              accountType: prev[investment.id]?.accountType ?? investment.accountType,
                              provider: prev[investment.id]?.provider ?? (investment.provider ?? ''),
                              currentValueIls: prev[investment.id]?.currentValueIls ?? String(investment.currentValueIls),
                              yearlyDepositIls: prev[investment.id]?.yearlyDepositIls ?? String(investment.yearlyDepositIls ?? ''),
                            },
                          }))
                        }
                      />
                      <TextField
                        size="small"
                        label={t('fieldAccountType')}
                        value={investmentDrafts[investment.id]?.accountType ?? investment.accountType}
                        onChange={(event) =>
                          setInvestmentDrafts((prev) => ({
                            ...prev,
                            [investment.id]: {
                              name: prev[investment.id]?.name ?? investment.name,
                              accountType: event.target.value,
                              provider: prev[investment.id]?.provider ?? (investment.provider ?? ''),
                              currentValueIls: prev[investment.id]?.currentValueIls ?? String(investment.currentValueIls),
                              yearlyDepositIls: prev[investment.id]?.yearlyDepositIls ?? String(investment.yearlyDepositIls ?? ''),
                            },
                          }))
                        }
                      />
                      <TextField
                        size="small"
                        label={t('fieldProvider')}
                        value={investmentDrafts[investment.id]?.provider ?? (investment.provider ?? '')}
                        onChange={(event) =>
                          setInvestmentDrafts((prev) => ({
                            ...prev,
                            [investment.id]: {
                              name: prev[investment.id]?.name ?? investment.name,
                              accountType: prev[investment.id]?.accountType ?? investment.accountType,
                              provider: event.target.value,
                              currentValueIls: prev[investment.id]?.currentValueIls ?? String(investment.currentValueIls),
                              yearlyDepositIls: prev[investment.id]?.yearlyDepositIls ?? String(investment.yearlyDepositIls ?? ''),
                            },
                          }))
                        }
                      />
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <TextField
                        size="small"
                        label={t('fieldCurrentValueIls')}
                        type="number"
                        value={investmentDrafts[investment.id]?.currentValueIls ?? String(investment.currentValueIls)}
                        onChange={(event) =>
                          setInvestmentDrafts((prev) => ({
                            ...prev,
                            [investment.id]: {
                              name: prev[investment.id]?.name ?? investment.name,
                              accountType: prev[investment.id]?.accountType ?? investment.accountType,
                              provider: prev[investment.id]?.provider ?? (investment.provider ?? ''),
                              currentValueIls: event.target.value,
                              yearlyDepositIls: prev[investment.id]?.yearlyDepositIls ?? String(investment.yearlyDepositIls ?? ''),
                            },
                          }))
                        }
                      />
                      <TextField
                        size="small"
                        label={t('fieldYearlyDepositIls')}
                        type="number"
                        value={investmentDrafts[investment.id]?.yearlyDepositIls ?? String(investment.yearlyDepositIls ?? '')}
                        onChange={(event) =>
                          setInvestmentDrafts((prev) => ({
                            ...prev,
                            [investment.id]: {
                              name: prev[investment.id]?.name ?? investment.name,
                              accountType: prev[investment.id]?.accountType ?? investment.accountType,
                              provider: prev[investment.id]?.provider ?? (investment.provider ?? ''),
                              currentValueIls: prev[investment.id]?.currentValueIls ?? String(investment.currentValueIls),
                              yearlyDepositIls: event.target.value,
                            },
                          }))
                        }
                      />
                      <IconButton
                        color="primary"
                        onClick={() =>
                          updateInvestmentMutation.mutate({
                            id: investment.id,
                            data: {
                              name: investmentDrafts[investment.id]?.name ?? investment.name,
                              accountType: investmentDrafts[investment.id]?.accountType ?? investment.accountType,
                              provider: investmentDrafts[investment.id]?.provider ?? investment.provider ?? '',
                              currentValueIls: Number(
                                investmentDrafts[investment.id]?.currentValueIls ?? investment.currentValueIls,
                              ),
                              yearlyDepositIls: (investmentDrafts[investment.id]?.yearlyDepositIls ?? '').trim()
                                ? Number(investmentDrafts[investment.id]?.yearlyDepositIls)
                                : null,
                            },
                          })
                        }
                        disabled={isBusy}
                      >
                        <SaveOutlinedIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => deleteInvestmentMutation.mutate(investment.id)}
                        disabled={isBusy}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                      {t('currentValueLabel')}: {toCurrency(investment.currentValueIls)}
                    </Typography>
                  </Stack>
                ))}

                <Stack spacing={1}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      label={t('fieldName')}
                      value={newInvestment.name}
                      onChange={(event) => setNewInvestment((prev) => ({ ...prev, name: event.target.value }))}
                    />
                    <TextField
                      size="small"
                      label={t('fieldAccountType')}
                      value={newInvestment.accountType}
                      onChange={(event) =>
                        setNewInvestment((prev) => ({ ...prev, accountType: event.target.value }))
                      }
                    />
                    <TextField
                      size="small"
                      label={t('fieldProvider')}
                      value={newInvestment.provider}
                      onChange={(event) => setNewInvestment((prev) => ({ ...prev, provider: event.target.value }))}
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      type="number"
                      label={t('fieldCurrentValueIls')}
                      value={newInvestment.currentValueIls}
                      onChange={(event) =>
                        setNewInvestment((prev) => ({ ...prev, currentValueIls: event.target.value }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label={t('fieldYearlyDepositIls')}
                      value={newInvestment.yearlyDepositIls}
                      onChange={(event) =>
                        setNewInvestment((prev) => ({ ...prev, yearlyDepositIls: event.target.value }))
                      }
                    />
                    <Button
                      variant="contained"
                      onClick={() =>
                        createInvestmentMutation.mutate(
                          {
                            name: newInvestment.name.trim(),
                            accountType: newInvestment.accountType.trim(),
                            provider: newInvestment.provider.trim(),
                            currentValueIls: Number(newInvestment.currentValueIls),
                            yearlyDepositIls: newInvestment.yearlyDepositIls.trim()
                              ? Number(newInvestment.yearlyDepositIls)
                              : null,
                            profileId,
                          },
                          {
                            onSuccess: () =>
                              setNewInvestment({
                                name: '',
                                accountType: '',
                                provider: '',
                                currentValueIls: '',
                                yearlyDepositIls: '',
                              }),
                          },
                        )
                      }
                      disabled={
                        isBusy || !newInvestment.name.trim() || !newInvestment.accountType.trim() || !newInvestment.currentValueIls
                      }
                    >
                      {t('buttonAdd')}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
