// The agent builder was removed when we moved to the platform-agent model
// (Shape 2). All product config is now Knowledge + Channels.
import { redirect } from 'next/navigation';

export default function DeprecatedAgentDetail() {
  redirect('/inbox');
}
