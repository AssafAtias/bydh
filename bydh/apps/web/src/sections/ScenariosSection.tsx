import { Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import type { Scenario } from '../api/dashboard'
import { useI18n } from '../lib/i18n'
import { toCurrency } from '../lib/format'

interface Props {
  scenarios: Scenario[]
}

export function ScenariosSection({ scenarios }: Props) {
  const { t } = useI18n()
  return (
    <Grid container spacing={2}>
      {scenarios.map((scenario) => (
        <Grid key={scenario.id} size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                {scenario.label}
              </Typography>
              <Stack mt={2} spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {t('scenarioTotalCost')}: {toCurrency(scenario.totalCostIls)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('scenarioEquity')}: {toCurrency(scenario.equityIls)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('scenarioMortgage')}: {toCurrency(scenario.mortgageIls)}
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t('scenarioMonthlyPayment')}: {toCurrency(scenario.monthlyPayIls)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
