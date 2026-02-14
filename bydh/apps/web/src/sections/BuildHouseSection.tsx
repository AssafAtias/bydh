import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardContent, Chip, Divider, Grid, IconButton, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { createBuildItem, createHouseType, deleteBuildItem, updateBuildItem } from '../api/dashboard'
import type { HouseBuild } from '../api/dashboard'
import { useI18n } from '../lib/i18n'
import { toCurrency } from '../lib/format'

interface Props {
  builds: HouseBuild[]
}

export function BuildHouseSection({ builds }: Props) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<
    Record<string, { stage: string; name: string; amountIls: string; percentHint: string; notes: string; order: string }>
  >({})
  const [newItems, setNewItems] = useState<
    Record<string, { stage: string; name: string; amountIls: string; percentHint: string; notes: string; order: string }>
  >({})
  const [newHouseType, setNewHouseType] = useState({ label: '', description: '' })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['build'] })
  const createMutation = useMutation({ mutationFn: createBuildItem, onSuccess: refresh })
  const createHouseTypeMutation = useMutation({ mutationFn: createHouseType, onSuccess: refresh })
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { stage: string; name: string; amountIls: number; percentHint?: number | null; notes?: string; order?: number }
    }) => updateBuildItem(id, data),
    onSuccess: refresh,
  })
  const deleteMutation = useMutation({ mutationFn: deleteBuildItem, onSuccess: refresh })
  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || createHouseTypeMutation.isPending

  return (
    <Stack spacing={2}>
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack spacing={1.25}>
            <Typography variant="subtitle2" fontWeight={700}>
              {t('buildAddHouseTypeHint')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                size="small"
                label={t('fieldHouseType')}
                value={newHouseType.label}
                onChange={(event) => setNewHouseType((prev) => ({ ...prev, label: event.target.value }))}
              />
              <TextField
                size="small"
                fullWidth
                label={t('fieldHouseDescription')}
                value={newHouseType.description}
                onChange={(event) => setNewHouseType((prev) => ({ ...prev, description: event.target.value }))}
              />
              <Button
                variant="contained"
                onClick={() =>
                  createHouseTypeMutation.mutate(
                    {
                      label: newHouseType.label.trim(),
                      description: newHouseType.description.trim(),
                    },
                    {
                      onSuccess: () => setNewHouseType({ label: '', description: '' }),
                    },
                  )
                }
                disabled={isBusy || !newHouseType.label.trim()}
              >
                {t('buttonAddHouseType')}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {builds.map((house) => (
          <Grid key={house.id} size={{ xs: 12, lg: 6 }}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <div>
                    <Typography variant="h6" fontWeight={700}>
                      {house.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {house.description}
                    </Typography>
                  </div>
                  <Chip label={toCurrency(house.total)} color="primary" />
                </Stack>

              <Stack mt={2} spacing={1.25}>
                {house.items.map((item, index) => (
                  <div key={item.id}>
                    <Stack spacing={1}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          size="small"
                          label={t('fieldStage')}
                          value={drafts[item.id]?.stage ?? item.stage}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                stage: event.target.value,
                                name: prev[item.id]?.name ?? item.name,
                                amountIls: prev[item.id]?.amountIls ?? String(item.amountIls),
                                percentHint: prev[item.id]?.percentHint ?? String(item.percentHint ?? ''),
                                notes: prev[item.id]?.notes ?? (item.notes ?? ''),
                                order: prev[item.id]?.order ?? String(index + 1),
                              },
                            }))
                          }
                        />
                        <TextField
                          size="small"
                          label={t('fieldItem')}
                          value={drafts[item.id]?.name ?? item.name}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                stage: prev[item.id]?.stage ?? item.stage,
                                name: event.target.value,
                                amountIls: prev[item.id]?.amountIls ?? String(item.amountIls),
                                percentHint: prev[item.id]?.percentHint ?? String(item.percentHint ?? ''),
                                notes: prev[item.id]?.notes ?? (item.notes ?? ''),
                                order: prev[item.id]?.order ?? String(index + 1),
                              },
                            }))
                          }
                        />
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          size="small"
                          type="number"
                          label={t('fieldAmountIls')}
                          value={drafts[item.id]?.amountIls ?? String(item.amountIls)}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                stage: prev[item.id]?.stage ?? item.stage,
                                name: prev[item.id]?.name ?? item.name,
                                amountIls: event.target.value,
                                percentHint: prev[item.id]?.percentHint ?? String(item.percentHint ?? ''),
                                notes: prev[item.id]?.notes ?? (item.notes ?? ''),
                                order: prev[item.id]?.order ?? String(index + 1),
                              },
                            }))
                          }
                        />
                        <TextField
                          size="small"
                          type="number"
                          label={t('fieldPercentHint')}
                          value={drafts[item.id]?.percentHint ?? String(item.percentHint ?? '')}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                stage: prev[item.id]?.stage ?? item.stage,
                                name: prev[item.id]?.name ?? item.name,
                                amountIls: prev[item.id]?.amountIls ?? String(item.amountIls),
                                percentHint: event.target.value,
                                notes: prev[item.id]?.notes ?? (item.notes ?? ''),
                                order: prev[item.id]?.order ?? String(index + 1),
                              },
                            }))
                          }
                        />
                        <TextField
                          size="small"
                          type="number"
                          label={t('fieldOrder')}
                          value={drafts[item.id]?.order ?? String(index + 1)}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                stage: prev[item.id]?.stage ?? item.stage,
                                name: prev[item.id]?.name ?? item.name,
                                amountIls: prev[item.id]?.amountIls ?? String(item.amountIls),
                                percentHint: prev[item.id]?.percentHint ?? String(item.percentHint ?? ''),
                                notes: prev[item.id]?.notes ?? (item.notes ?? ''),
                                order: event.target.value,
                              },
                            }))
                          }
                        />
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <TextField
                          size="small"
                          fullWidth
                          label={t('fieldNotes')}
                          value={drafts[item.id]?.notes ?? (item.notes ?? '')}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                stage: prev[item.id]?.stage ?? item.stage,
                                name: prev[item.id]?.name ?? item.name,
                                amountIls: prev[item.id]?.amountIls ?? String(item.amountIls),
                                percentHint: prev[item.id]?.percentHint ?? String(item.percentHint ?? ''),
                                notes: event.target.value,
                                order: prev[item.id]?.order ?? String(index + 1),
                              },
                            }))
                          }
                        />
                        <IconButton
                          color="primary"
                          onClick={() =>
                            updateMutation.mutate({
                              id: item.id,
                              data: {
                                stage: drafts[item.id]?.stage ?? item.stage,
                                name: drafts[item.id]?.name ?? item.name,
                                amountIls: Number(drafts[item.id]?.amountIls ?? item.amountIls),
                                percentHint: (drafts[item.id]?.percentHint ?? '').trim()
                                  ? Number(drafts[item.id]?.percentHint)
                                  : null,
                                notes: drafts[item.id]?.notes ?? item.notes ?? '',
                                order: Number(drafts[item.id]?.order ?? index + 1),
                              },
                            })
                          }
                          disabled={isBusy}
                        >
                          <SaveOutlinedIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => deleteMutation.mutate(item.id)} disabled={isBusy}>
                          <DeleteOutlineIcon />
                        </IconButton>
                        <Typography fontWeight={700}>{toCurrency(item.amountIls)}</Typography>
                      </Stack>
                    </Stack>
                    {index < house.items.length - 1 ? <Divider sx={{ mt: 1.25 }} /> : null}
                  </div>
                ))}

                <Divider sx={{ mt: 1 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('buildAddHint')}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    label={t('fieldStage')}
                    value={newItems[house.id]?.stage ?? ''}
                    onChange={(event) =>
                      setNewItems((prev) => ({
                        ...prev,
                        [house.id]: {
                          stage: event.target.value,
                          name: prev[house.id]?.name ?? '',
                          amountIls: prev[house.id]?.amountIls ?? '',
                          percentHint: prev[house.id]?.percentHint ?? '',
                          notes: prev[house.id]?.notes ?? '',
                          order: prev[house.id]?.order ?? String(house.items.length + 1),
                        },
                      }))
                    }
                  />
                  <TextField
                    size="small"
                    label={t('fieldItem')}
                    value={newItems[house.id]?.name ?? ''}
                    onChange={(event) =>
                      setNewItems((prev) => ({
                        ...prev,
                        [house.id]: {
                          stage: prev[house.id]?.stage ?? '',
                          name: event.target.value,
                          amountIls: prev[house.id]?.amountIls ?? '',
                          percentHint: prev[house.id]?.percentHint ?? '',
                          notes: prev[house.id]?.notes ?? '',
                          order: prev[house.id]?.order ?? String(house.items.length + 1),
                        },
                      }))
                    }
                  />
                  <TextField
                    size="small"
                    type="number"
                    label={t('fieldAmountIls')}
                    value={newItems[house.id]?.amountIls ?? ''}
                    onChange={(event) =>
                      setNewItems((prev) => ({
                        ...prev,
                        [house.id]: {
                          stage: prev[house.id]?.stage ?? '',
                          name: prev[house.id]?.name ?? '',
                          amountIls: event.target.value,
                          percentHint: prev[house.id]?.percentHint ?? '',
                          notes: prev[house.id]?.notes ?? '',
                          order: prev[house.id]?.order ?? String(house.items.length + 1),
                        },
                      }))
                    }
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    type="number"
                    label={t('fieldPercentHint')}
                    value={newItems[house.id]?.percentHint ?? ''}
                    onChange={(event) =>
                      setNewItems((prev) => ({
                        ...prev,
                        [house.id]: {
                          stage: prev[house.id]?.stage ?? '',
                          name: prev[house.id]?.name ?? '',
                          amountIls: prev[house.id]?.amountIls ?? '',
                          percentHint: event.target.value,
                          notes: prev[house.id]?.notes ?? '',
                          order: prev[house.id]?.order ?? String(house.items.length + 1),
                        },
                      }))
                    }
                  />
                  <TextField
                    size="small"
                    type="number"
                    label={t('fieldOrder')}
                    value={newItems[house.id]?.order ?? String(house.items.length + 1)}
                    onChange={(event) =>
                      setNewItems((prev) => ({
                        ...prev,
                        [house.id]: {
                          stage: prev[house.id]?.stage ?? '',
                          name: prev[house.id]?.name ?? '',
                          amountIls: prev[house.id]?.amountIls ?? '',
                          percentHint: prev[house.id]?.percentHint ?? '',
                          notes: prev[house.id]?.notes ?? '',
                          order: event.target.value,
                        },
                      }))
                    }
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label={t('fieldNotes')}
                    value={newItems[house.id]?.notes ?? ''}
                    onChange={(event) =>
                      setNewItems((prev) => ({
                        ...prev,
                        [house.id]: {
                          stage: prev[house.id]?.stage ?? '',
                          name: prev[house.id]?.name ?? '',
                          amountIls: prev[house.id]?.amountIls ?? '',
                          percentHint: prev[house.id]?.percentHint ?? '',
                          notes: event.target.value,
                          order: prev[house.id]?.order ?? String(house.items.length + 1),
                        },
                      }))
                    }
                  />
                </Stack>
                <Button
                  variant="contained"
                  onClick={() =>
                    createMutation.mutate(
                      {
                        houseTypeId: house.id,
                        stage: (newItems[house.id]?.stage ?? '').trim(),
                        name: (newItems[house.id]?.name ?? '').trim(),
                        amountIls: Number(newItems[house.id]?.amountIls ?? ''),
                        percentHint: (newItems[house.id]?.percentHint ?? '').trim()
                          ? Number(newItems[house.id]?.percentHint)
                          : null,
                        notes: (newItems[house.id]?.notes ?? '').trim(),
                        order: Number(newItems[house.id]?.order ?? house.items.length + 1),
                      },
                      {
                        onSuccess: () =>
                          setNewItems((prev) => ({
                            ...prev,
                            [house.id]: {
                              stage: '',
                              name: '',
                              amountIls: '',
                              percentHint: '',
                              notes: '',
                              order: String(house.items.length + 1),
                            },
                          })),
                      },
                    )
                  }
                  disabled={
                    isBusy || !(newItems[house.id]?.stage ?? '').trim() || !(newItems[house.id]?.name ?? '').trim() || !(newItems[house.id]?.amountIls ?? '').trim()
                  }
                >
                  {t('buttonAddBuildStep')}
                </Button>
              </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
