type Props = {
  address?: string
  onConnect: () => void
}

export default function WalletConnect({ address, onConnect }: Props) {
  return (
    <button onClick={onConnect}>
      {address ? address : "Connect Wallet"}
    </button>
  )
}
