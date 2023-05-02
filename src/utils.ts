import algosdk from 'algosdk'

type TealKeyValueStore = algosdk.modelsv2.TealKeyValue[]

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class State {
  indexerClient: algosdk.Indexer

  constructor(indexerClient: algosdk.Indexer) {
    this.indexerClient = indexerClient
  }

  getValue(state: TealKeyValueStore, key: string) {
    if (!!!state) {
      return null
    }

    const kv = state.find(el => atob(el.key) == key)
    if (!!kv) {
      return kv.value
    } else {
      return null
    }
  }

  getString(state: TealKeyValueStore, key: string) {
    const kv = this.getValue(state, key)
    if (!!kv) {
      return kv.bytes
    } else {
      return ""
    }
  }

  getUint(state: TealKeyValueStore, key: string) {
    const kv = this.getValue(state, key)
    if (!!kv) {
      return kv.uint
    } else {
      return 0
    }
  }

  async getGlobalState(appID: number) {
    const app = await this.indexerClient.lookupApplications(appID).do();
    const state = app['application']['params']['global-state']
    return state
  }

  async getOptedInRound(address: string, appID: number, round?: number) {
    const state = await this._getLocalState(address, appID, round)
    if (!!state) {
      return state.optedInAtRound;
    } else {
      return 0;
    }
    if (!!!address) {
      return 0
    }
  }

  async getLocalState(address: string, appID: number, round?: number) {
    const state = await this._getLocalState(address, appID, round)
    if (!!state) {
      return state.keyValue;
    } else {
      return null;
    }
  }

  async _getLocalState(address: string, appID: number, round?: number) {
    if (!!!address) {
      return null
    }


    let end: number = 30
    let appsLocalStates: algosdk.indexerModels.ApplicationLocalState[] = []
    if (!!!round) {
      end = 1
      round = 0
    }

    for (let i=0; i<end; i++) {
      const resp = await this.indexerClient.lookupAccountAppLocalStates(address).limit(10).do();
      if (!!!resp["apps-local-states"] && !!resp["apps-local-state"]) {
        resp["apps-local-states"] = resp["apps-local-state"]
      }

      const accountAppLocalStates = algosdk.indexerModels.ApplicationLocalStatesResponse.from_obj_for_encoding(resp)
      if (accountAppLocalStates.currentRound >= round) {
        appsLocalStates = accountAppLocalStates.appsLocalStates
        break;
      }

      sleep(1000);
    }

    try {
      const state = appsLocalStates.find((el: any) => el.id == appID)
      if (!!!state) {
        return null
      }
      return state;
    } catch(e) {
      return null;
    }
  }

}
