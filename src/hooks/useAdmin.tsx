import { AxiosRequestConfig } from 'axios'
import useAxios from 'axios-hooks'
import { ServerConfigContainer } from 'containers/ConfigContainer'
import { useMyAxios } from 'hooks/useMyAxios'

const useAdmin = () => {
  const { authEnabled } = ServerConfigContainer.useContainer()
  const { axiosManualOptions } = useMyAxios()
  const [, execute] = useAxios({}, axiosManualOptions)

  const rescanPluginDirectory = () => {
    const patchData = {
      operation: 'rescan',
    }
    const config: AxiosRequestConfig = {
      url: '/api/v1/admin',
      method: 'patch',
      withCredentials: authEnabled,
      data: patchData,
    }

    return execute(config)
  }
  return { rescanPluginDirectory }
}

export default useAdmin
