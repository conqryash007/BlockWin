/**
 * Custom TRON WalletConnect adapter that uses our own QR modal instead of the
 * broken Reown AppKit, bypassing the relayer.publishCustom / QR-not-showing issues.
 */
import {
  Adapter,
  WalletConnectionError,
  WalletDisconnectionError,
  AdapterState,
  WalletWindowClosedError,
  WalletNotFoundError,
  WalletSignMessageError,
  WalletSignTransactionError,
  WalletDisconnectedError,
  WalletReadyState,
} from "@tronweb3/tronwallet-abstract-adapter";
import type { Transaction, SignedTransaction, AdapterName } from "@tronweb3/tronwallet-abstract-adapter";
import { ChainNetwork } from "@tronweb3/tronwallet-abstract-adapter";
import { UniversalProvider } from "@walletconnect/universal-provider";
import { getSdkError } from "@walletconnect/utils";
import { WalletConnectChainID } from "@tronweb3/walletconnect-tron";

const WalletConnectWalletName = "WalletConnect" as AdapterName<"WalletConnect">;
const WalletConnectMethods = {
  signTransaction: "tron_signTransaction" as const,
  signMessage: "tron_signMessage" as const,
};

const getConnectParams = (chainId: string) => ({
  requiredNamespaces: {
    tron: {
      chains: [chainId],
      methods: [WalletConnectMethods.signTransaction, WalletConnectMethods.signMessage],
      events: [] as string[],
    },
  },
});

export interface TronWalletConnectCustomAdapterConfig {
  network: `${ChainNetwork}` | string;
  options: {
    projectId: string;
    relayUrl?: string;
    metadata: {
      name: string;
      description: string;
      url: string;
      icons: string[];
    };
  };
  onDisplayUri: (uri: string) => void;
  onCloseModal: () => void;
}

export class TronWalletConnectCustomAdapter extends Adapter {
  name = WalletConnectWalletName;
  url = "https://walletconnect.org";
  icon =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNjEuNDM4NTQsOTQuMDAzOGM0OC45MTEyMywtNDcuODg4MTcgMTI4LjIxMTk5LC00Ny44ODgxNyAxNzcuMTIzMjEsMGw1Ljg4NjU1LDUuNzYzNDJjMi40NDU1NiwyLjM5NDQxIDIuNDQ1NTYsNi4yNzY1MSAwLDguNjcwOTJsLTIwLjEzNjcsMTkuNzE1NWMtMS4yMjI3OCwxLjE5NzIxIC0zLjIwNTMsMS4xOTcyMSAtNC40MjgwOCwwbC04LjEwMDU4LC03LjkzMTE1Yy0zNC4xMjE2OSwtMzMuNDA3OTggLTg5LjQ0Mzg5LC0zMy40MDc5OCAtMTIzLjU2NTU4LDBsLTguNjc1MDYsOC40OTM2MWMtMS4yMjI3OCwxLjE5NzIgLTMuMjA1MywxLjE5NzIgLTQuNDI4MDgsMGwtMjAuMTM2NjksLTE5LjcxNTVjLTIuNDQ1NTYsLTIuMzk0NDEgLTIuNDQ1NTYsLTYuMjc2NTIgMCwtOC42NzA5Mmw2LjQ2MTAxLC02LjMyNTg4em0yMTguNzY3OCw0MC43NzM3NWwxNy45MjE3LDE3LjU0Njg5YzIuNDQ1NTQsMi4zOTQ0IDIuNDQ1NTYsNi4yNzY0OCAwLjAwMDAzLDguNjcwODlsLTgwLjgxMDE3LDc5LjEyMTE0Yy0yLjQ0NTU1LDIuMzk0NDIgLTYuNDEwNTksMi4zOTQ0NSAtOC44NTYxNiwwLjAwMDA2Yy0wLjAwMDAxLC0wLjAwMDAxIC0wLjAwMDAzLC0wLjAwMDAyIC0wLjAwMDA0LC0wLjAwMDAzbC01Ny4zNTQxNCwtNTYuMTU0NThjLTAuNjExMzksLTAuNTk4NiAtMS42MDI2NSwtMC41OTg2IC0yLjIxNDA0LDBjMCwwLjAwMDAxIC0wLjAwMDAxLDAuMDAwMDEgLTAuMDAwMDEsMC4wMDAwMmwtNTcuMzUyOTIsNTYuMTU0NTNjLTIuNDQ1NTQsMi4zOTQ0MyAtNi40MTA1OCwyLjM5NDQ3IC04Ljg1NjE2LDAuMDAwMDhjLTAuMDAwMDIsLTAuMDAwMDEgLTAuMDAwMDMsLTAuMDAwMDIgLTAuMDAwMDUsLTAuMDAwMDRsLTgwLjgxMjQyLC03OS4xMjIxOWMtMi40NDU1NiwtMi4zOTQ0IC0yLjQ0NTU2LC02LjI3NjUxIDAsLTguNjcwOTFsMTcuOTIxNzMsLTE3LjU0Njg3YzIuNDQ1NTYsLTIuMzk0NDEgNi40MTA2LC0yLjM5NDQxIDguODU2MTYsMGw1Ny4zNTQ5OCw1Ni4xNTUzNWMwLjYxMTM5LDAuNTk4NjEgMS42MDI2NSwwLjU5ODYxIDIuMjE0MDQsMGMwLjAwMDAxLDAgMC4wMDAwMiwtMC4wMDAwMSAwLjAwMDAzLC0wLjAwMDAybDU3LjM1MjEsLTU2LjE1NTMzYzIuNDQ1NSwtMi4zOTQ0NyA2LjQxMDU0LC0yLjM5NDU2IDguODU2MTYsLTAuMDAwMmMwLjAwMDAzLDAuMDAwMDMgMC4wMDAwNywwLjAwMDA3IDAuMDAwMSwwLjAwMDFsNTcuMzU0OSw1Ni4xNTU0M2MwLjYxMTM5LDAuNTk4NiAxLjYwMjY1LDAuNTk4NiAyLjIxNDA0LDBsNTcuMzUzOTgsLTU2LjE1NDMyYzIuNDQ1NTYsLTIuMzk0NDEgNi40MTA2LC0yLjM5NDQxIDguODU2MTYsMHoiIGZpbGw9IiMzYjk5ZmMiIGlkPSJzdmdfMSIvPjwvc3ZnPg==";

  private _readyState = WalletReadyState.Found;
  private _state: AdapterState = AdapterState.Disconnect;
  private _connecting = false;
  private _address: string | null = null;
  private _config: TronWalletConnectCustomAdapterConfig;
  private _provider: InstanceType<typeof UniversalProvider> | null = null;
  private _session: { topic: string; sessionProperties?: Record<string, string>; namespaces: Record<string, { accounts: string[] }> } | null = null;
  private _network: string;
  private _displayUriUnsubscribe: (() => void) | null = null;

  constructor(config: TronWalletConnectCustomAdapterConfig) {
    super();
    this._config = config;
    this._network =
      (WalletConnectChainID as Record<string, string>)[config.network] ?? `tron:${config.network}`;
  }

  get address() {
    return this._address;
  }
  get readyState() {
    return this._readyState;
  }
  get state() {
    return this._state;
  }
  get connecting() {
    return this._connecting;
  }

  private extractAddressFromSession(session: typeof this._session): string {
    if (!session) throw new Error("No session");
    const accounts = Object.values(session.namespaces).flatMap((ns) => ns.accounts);
    const account = accounts[0];
    if (!account) throw new Error("No accounts in session");
    const addr = account.split(":")[2];
    if (!addr) throw new Error(`Invalid account format: ${account}`);
    return addr;
  }

  async connect(): Promise<void> {
    try {
      if (this.connected) return;
      if (this.state === AdapterState.NotFound) throw new WalletNotFoundError();
      this._connecting = true;

      const provider = await UniversalProvider.init({
        projectId: this._config.options.projectId,
        relayUrl: this._config.options.relayUrl ?? "wss://relay.walletconnect.com",
        metadata: this._config.options.metadata,
      });
      this._provider = provider;

      const client = provider.client;
      const connectParams = getConnectParams(this._network);
      const existing = client.find(connectParams).filter((s: { acknowledged?: boolean }) => s.acknowledged);
      if (existing.length > 0) {
        const session = existing[existing.length - 1];
        this._session = session as typeof this._session;
        this._address = this.extractAddressFromSession(this._session);
        this._state = AdapterState.Connected;
        this.emit("stateChanged", this._state);
        this.emit("connect", this._address);
        return;
      }

      provider.on("display_uri", (uri: string) => {
        this._config.onDisplayUri(uri);
      });

      try {
        const session = await provider.connect({
          pairingTopic: undefined,
          optionalNamespaces: connectParams.requiredNamespaces as Parameters<typeof provider.connect>[0]["optionalNamespaces"],
        });
        this._session = session as typeof this._session;
        this._address = this.extractAddressFromSession(this._session);
        this._state = AdapterState.Connected;
        this.emit("stateChanged", this._state);
        this.emit("connect", this._address);
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? "";
        if (msg.includes("closed") || msg.includes("rejected")) throw new WalletWindowClosedError();
        throw new WalletConnectionError(msg, err as Error);
      } finally {
        this._config.onCloseModal();
      }
    } catch (error) {
      const err = error instanceof WalletConnectionError
        ? error
        : new WalletConnectionError((error as Error)?.message ?? String(error), error as Error);
      this.emit("error", err);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.state === AdapterState.NotFound || !this.connected) return;
    const topic = this._session?.topic;
    if (topic && this._provider?.client) {
      try {
        await this._provider.client.disconnect({
          topic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
      } catch (e) {
        this.emit("error", new WalletDisconnectionError((e as Error)?.message, e as Error));
      }
    }
    this._session = null;
    this._address = null;
    this._provider = null;
    this._state = AdapterState.Disconnect;
    this.emit("disconnect");
    this.emit("stateChanged", this._state);
  }

  async signTransaction(transaction: Transaction): Promise<SignedTransaction> {
    if (this.state !== AdapterState.Connected || !this._session || !this._provider?.client)
      throw new WalletDisconnectedError();
    try {
      const sessionProperties = this._session.sessionProperties;
      const isV1Method = sessionProperties?.tron_method_version === "v1";
      const result = await this._provider.client.request({
        chainId: this._network,
        topic: this._session.topic,
        request: {
          method: WalletConnectMethods.signTransaction,
          params: isV1Method
            ? { address: this._address, transaction }
            : { address: this._address, transaction: { transaction } },
        },
      });
      return (result as { result?: SignedTransaction })?.result ?? (result as SignedTransaction);
    } catch (e) {
      throw new WalletSignTransactionError((e as Error)?.message, e as Error);
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this._session || !this._provider?.client) throw new WalletDisconnectedError();
    try {
      const { signature } = (await this._provider.client.request({
        chainId: this._network,
        topic: this._session.topic,
        request: {
          method: WalletConnectMethods.signMessage,
          params: { address: this._address, message },
        },
      })) as { signature: string };
      return signature;
    } catch (e) {
      throw new WalletSignMessageError((e as Error)?.message, e as Error);
    }
  }
}
