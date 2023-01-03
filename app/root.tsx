import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import createServerSupabase from "utils/supabase.server";

import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "db_types";

type TypedSupabaseClient = SupabaseClient<Database>;

export type SupabaseOutletContext = {
  supabase: TypedSupabaseClient;
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Chatter",
  viewport: "width=device-width,initial-scale=1",
});

export const loader = async ({ request }: LoaderArgs) => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };

  /**
   * This supabase client may need to refresh the access token when making a request to Supabase.
   */
  const response = new Response();

  /**
   * Create new supabase client
   */
  const supabase = createServerSupabase({ request, response });

  /**
   * Get current Supabase session
   */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return json({ env, session }, { headers: response.headers });
};

export default function App() {
  /**
   * Destructure the data received by the `useLoader` hook
   */
  const { env, session } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();

  const serverAccessToken = session?.access_token;

  const [supabase] = useState(() =>
    createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  );

  /**
   * useEffect runs client-side; use the singleton to get the client session
   * by default, Supabase stores our session information in Local Storage
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        // Data is out of sync, call loaders again!
        fetcher.submit(null, {
          method: "post",
          action: "/handle-supabase-auth",
        });
      }
    });

    // Cleanup function for the subscription listener
    return () => {
      subscription.unsubscribe();
    };
  }, [serverAccessToken, supabase, fetcher]);

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet context={{ supabase }} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
