import { getPayload as getPayloadBase } from 'payload'
import configPromise from '@payload-config'

export const getPayload = async () => {
  return getPayloadBase({ config: configPromise })
}
