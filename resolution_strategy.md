# Resolution Strategy

If the `npm list` confirms multiple versions, I will:

1.  Identify the version required by the Tron adapter (likely 2.11.x or similar).
2.  Use `overrides` (if npm 8+) or `resolutions` (if yarn/pnpm, though user seems to use npm).
3.  Add the following to `package.json`:
    ```json
    "overrides": {
      "@walletconnect/core": "2.11.1" 
    }
    ```
    (Version to be determined based on what works for Tron).

Alternatively, if Tron adapter is just broken with newer WalletConnect, I might need to downgrade Wagmi or find a compatible middle ground.
