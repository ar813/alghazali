import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

// This client requires a write token present in the environment as SANITY_API_WRITE_TOKEN
export const serverClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

export default serverClient
