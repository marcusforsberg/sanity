import path from 'path'
import chalk from 'chalk'
import client from '@sanity/client'
import {generateHelpUrl} from '@sanity/generate-help-url'
import getUserConfig from './getUserConfig'

const apiHosts = {
  staging: 'https://api.sanity.work',
  development: 'http://api.sanity.wtf',
}

/**
 * Creates a wrapper/getter function to retrieve a Sanity API client.
 * Instead of spreading the error checking logic around the project,
 * we call it here when (and only when) a command needs to use the API
 */
const defaults = {
  requireUser: true,
  requireProject: true,
}

const authErrors = () => ({
  onError: (err) => {
    const statusCode = err.response && err.response.body && err.response.body.statusCode
    if (statusCode === 401) {
      err.message = `${err.message}. You may need to login again with ${chalk.cyan(
        'sanity login'
      )}.\nFor more information, see ${generateHelpUrl('cli-errors')}.`
    }
    return err
  },
})

export function getCliToken() {
  // eslint-disable-next-line no-process-env
  const envAuthToken = process.env.SANITY_AUTH_TOKEN
  const userConfig = getUserConfig()
  return envAuthToken || userConfig.get('authToken')
}

export default function clientWrapper(buildConfig, configPath) {
  const requester = client.requester.clone()
  requester.use(authErrors())

  return function (opts = {}) {
    // Read these environment variables "late" to allow `.env` files

    /* eslint-disable no-process-env */
    const sanityEnv = process.env.SANITY_INTERNAL_ENV || 'production'
    /* eslint-enable no-process-env */

    const {requireUser, requireProject, api} = {...defaults, ...opts}
    const token = getCliToken()
    const apiHost = apiHosts[sanityEnv]
    const apiConfig = {
      ...((buildConfig && buildConfig.api) || {}),
      ...(api || {}),
    }

    if (apiHost) {
      apiConfig.apiHost = apiHost
    }

    if (requireUser && !token) {
      throw new Error('You must login first - run "sanity login"')
    }

    if (requireProject && !apiConfig.projectId) {
      const relativeConfigPath = path.relative(process.cwd(), configPath)
      throw new Error(
        `${relativeConfigPath} does not contain a project identifier ("api.projectId"), ` +
          'which is required for the Sanity CLI to communicate with the Sanity API'
      )
    }

    return client({
      ...apiConfig,
      apiVersion: '1',
      dataset: apiConfig.dataset || '~dummy-placeholder-dataset-',
      token: requireUser ? token : undefined,
      useProjectHostname: requireProject,
      requester,
      useCdn: false,
    })
  }
}
