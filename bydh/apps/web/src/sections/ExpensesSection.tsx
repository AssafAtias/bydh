import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardContent, Divider, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { createExpense, deleteExpense, updateExpense } from '../api/dashboard'
import type { FamilyFinance } from '../api/dashboard'
import { useI18n } from '../lib/i18n'
import { toCurrency } from '../lib/format'

interface Props {
  finance: FamilyFinance
  profileId: string
}

export function ExpensesSection({ finance, profileId }: Props) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, { name: string; monthlyIls: string; typeId: string }>>({})
  const [newExpense, setNewExpense] = useState({
    name: '',
    monthlyIls: '',
    typeId: finance.expenseTypes[0]?.id ?? '',
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['finances'] })
  const createMutation = useMutation({ mutationFn: createExpense, onSuccess: refresh })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; monthlyIls: number; typeId: string } }) =>
      updateExpense(id, data),
    onSuccess: refresh,
  })
  const deleteMutation = useMutation({ mutationFn: deleteExpense, onSuccess: refresh })
  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700}>
          {t('expensesTitle')}
        </Typography>
        <Stack mt={2} spacing={1.5}>
          {finance.expenses.map((expense, index) => (
            <div key={expense.id}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                <TextField
                  size="small"
                  label={t('fieldName')}
                  value={drafts[expense.id]?.name ?? expense.name}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [expense.id]: {
                        name: event.target.value,
                        monthlyIls: prev[expense.id]?.monthlyIls ?? String(expense.monthlyIls),
                        typeId: prev[expense.id]?.typeId ?? expense.typeId,
                      },
                    }))
                  }
                />
                <TextField
                  size="small"
                  type="number"
                  label={t('fieldMonthlyIls')}
                  value={drafts[expense.id]?.monthlyIls ?? String(expense.monthlyIls)}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [expense.id]: {
                        name: prev[expense.id]?.name ?? expense.name,
                        monthlyIls: event.target.value,
                        typeId: prev[expense.id]?.typeId ?? expense.typeId,
                      },
                    }))
                  }
                />
                <TextField
                  select
                  size="small"
                  label={t('fieldType')}
                  value={drafts[expense.id]?.typeId ?? expense.typeId}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [expense.id]: {
                        name: prev[expense.id]?.name ?? expense.name,
                        monthlyIls: prev[expense.id]?.monthlyIls ?? String(expense.monthlyIls),
                        typeId: event.target.value,
                      },
                    }))
                  }
                >
                  {finance.expenseTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  color="primary"
                  onClick={() =>
                    updateMutation.mutate({
                      id: expense.id,
                      data: {
                        name: drafts[expense.id]?.name ?? expense.name,
                        monthlyIls: Number(drafts[expense.id]?.monthlyIls ?? expense.monthlyIls),
                        typeId: drafts[expense.id]?.typeId ?? expense.typeId,
                      },
                    })
                  }
                  disabled={isBusy}
                >
                  <SaveOutlinedIcon />
                </IconButton>
                <IconButton color="error" onClick={() => deleteMutation.mutate(expense.id)} disabled={isBusy}>
                  <DeleteOutlineIcon />
                </IconButton>
                <Typography ml={{ md: 'auto' }} fontWeight={700}>
                  {toCurrency(expense.monthlyIls)}
                </Typography>
              </Stack>
              {index < finance.expenses.length - 1 ? <Divider sx={{ mt: 1.5 }} /> : null}
            </div>
          ))}

          <Divider />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
            <TextField
              size="small"
              label={t('fieldName')}
              value={newExpense.name}
              onChange={(event) => setNewExpense((prev) => ({ ...prev, name: event.target.value }))}
            />
            <TextField
              size="small"
              type="number"
              label={t('fieldMonthlyIls')}
              value={newExpense.monthlyIls}
              onChange={(event) => setNewExpense((prev) => ({ ...prev, monthlyIls: event.target.value }))}
            />
            <TextField
              select
              size="small"
              label={t('fieldType')}
              value={newExpense.typeId}
              onChange={(event) => setNewExpense((prev) => ({ ...prev, typeId: event.target.value }))}
            >
              {finance.expenseTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={() =>
                createMutation.mutate(
                  {
                    name: newExpense.name.trim(),
                    monthlyIls: Number(newExpense.monthlyIls),
                    typeId: newExpense.typeId,
                    profileId,
                  },
                  {
                    onSuccess: () =>
                      setNewExpense({
                        name: '',
                        monthlyIls: '',
                        typeId: finance.expenseTypes[0]?.id ?? '',
                      }),
                  },
                )
              }
              disabled={isBusy || !newExpense.name.trim() || !newExpense.monthlyIls || !newExpense.typeId}
            >
              {t('buttonAdd')}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
