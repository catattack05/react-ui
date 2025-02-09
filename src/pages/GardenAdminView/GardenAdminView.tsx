import { Alert, Backdrop, CircularProgress, Typography } from '@mui/material'
import useAxios from 'axios-hooks'
import { Divider } from 'components/Divider'
import { GardenConnectionForm } from 'components/GardenConnectionForm'
import { GardenSyncButton } from 'components/GardenSyncButton'
import { PageHeader } from 'components/PageHeader'
import { Snackbar } from 'components/Snackbar'
import { Table } from 'components/Table'
import { ServerConfigContainer } from 'containers/ConfigContainer'
import { PermissionsContainer } from 'containers/PermissionsContainer'
import { SocketContainer } from 'containers/SocketContainer'
import { GardenAdminInfoCard } from 'pages/GardenAdminView'
import { systemMapper, useSystemIndexTableColumns } from 'pages/SystemIndex'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Garden } from 'types/backend-types'
import { SnackbarState } from 'types/custom-types'

const GardenAdminView = () => {
  const { authEnabled } = ServerConfigContainer.useContainer()
  const { hasPermission } = PermissionsContainer.useContainer()
  const systemsColumns = useSystemIndexTableColumns()

  const [syncStatus, setSyncStatus] = useState<SnackbarState | undefined>(
    undefined,
  )
  const [garden, setGarden] = useState<Garden>()
  const params = useParams()

  const gardenName = String(params.gardenName)

  const [{ data, error }, refetch] = useAxios({
    url: '/api/v1/gardens/' + gardenName,
    method: 'get',
    withCredentials: authEnabled,
  })

  useEffect(() => {
    if (data && !error) {
      setGarden(data)
    }
  }, [data, error])
  const { addCallback, removeCallback } = SocketContainer.useContainer()

  useEffect(() => {
    addCallback('garden_updates', (event) => {
      if (
        event.name === 'GARDEN_UPDATED' &&
        event.payload.name === gardenName
      ) {
        refetch()
      }
    })
    return () => {
      removeCallback('garden_updates')
    }
  }, [addCallback, removeCallback, refetch, gardenName])

  return (
    <>
      {hasPermission('garden:update') && (
        <Typography style={{ flex: 1, float: 'right' }}>
          <GardenSyncButton
            gardenName={gardenName}
            setSyncStatus={setSyncStatus}
          />
        </Typography>
      )}
      <PageHeader title="Garden View" description="" />
      <Divider />
      {garden ? (
        <>
          <GardenAdminInfoCard garden={garden} />
          <Divider />
          <Typography variant="h6">Connected Systems</Typography>
          {garden.status === 'RUNNING' ? (
            <Table
              tableKey="systems"
              data={garden.systems.map(systemMapper)}
              columns={systemsColumns}
            />
          ) : (
            `Unable to display systems when status is ${garden.status}`
          )}
          <Divider />
          {garden.connection_type === 'LOCAL' ? (
            <Alert severity="info">
              {
                'Since this is the local Garden it is not possible to modify connection information'
              }
            </Alert>
          ) : (
            garden.connection_params && <GardenConnectionForm garden={garden} />
          )}
        </>
      ) : (
        <Backdrop open={true}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
      {syncStatus ? <Snackbar status={syncStatus} /> : null}
    </>
  )
}

export { GardenAdminView }
