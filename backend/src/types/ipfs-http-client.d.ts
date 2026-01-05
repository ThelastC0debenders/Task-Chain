declare module "ipfs-http-client" {
  export interface AddResult {
    cid: { toString(): string }
  }

  export interface IPFSHTTPClient {
    add(data: string | Uint8Array): Promise<AddResult>
    cat(cid: string): AsyncIterable<Uint8Array>
  }

  export interface CreateOptions {
    url: string
  }

  export function create(options: CreateOptions): IPFSHTTPClient
}
