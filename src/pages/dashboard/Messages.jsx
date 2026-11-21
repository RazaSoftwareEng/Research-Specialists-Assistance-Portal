import { useDash } from './DashboardLayout'
import MessagesPanel from '../../components/MessagesPanel'

export default function Messages() {
  const { setUnread } = useDash()
  return <MessagesPanel onCount={setUnread} />
}
