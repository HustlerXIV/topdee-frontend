// /dashboard was the Shape-1 home. The platform-agent (Shape-2) UI uses
// /inbox as the post-login landing screen, so bounce visitors there.
import { redirect } from 'next/navigation';

export default function DashboardRedirect() {
  redirect('/inbox');
}
