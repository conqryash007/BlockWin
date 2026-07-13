--
-- PostgreSQL database cluster dump
--

\restrict lqq2ywnOsRAcUZWMAitI2fClYhFafPK0uH3FEbKcnVczDtEpl5kWtWpbbXqHBL2

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE anon;
ALTER ROLE anon WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticated;
ALTER ROLE authenticated WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticator;
ALTER ROLE authenticator WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE dashboard_user;
ALTER ROLE dashboard_user WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB NOLOGIN REPLICATION NOBYPASSRLS;
CREATE ROLE pgbouncer;
ALTER ROLE pgbouncer WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE postgres;
ALTER ROLE postgres WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;
CREATE ROLE service_role;
ALTER ROLE service_role WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION BYPASSRLS;
CREATE ROLE supabase_admin;
ALTER ROLE supabase_admin WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;
CREATE ROLE supabase_auth_admin;
ALTER ROLE supabase_auth_admin WITH NOSUPERUSER NOINHERIT CREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE supabase_etl_admin;
ALTER ROLE supabase_etl_admin WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN REPLICATION BYPASSRLS;
CREATE ROLE supabase_read_only_user;
ALTER ROLE supabase_read_only_user WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION BYPASSRLS;
CREATE ROLE supabase_realtime_admin;
ALTER ROLE supabase_realtime_admin WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE supabase_replication_admin;
ALTER ROLE supabase_replication_admin WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN REPLICATION NOBYPASSRLS;
CREATE ROLE supabase_storage_admin;
ALTER ROLE supabase_storage_admin WITH NOSUPERUSER NOINHERIT CREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;

--
-- User Configurations
--

--
-- User Config "anon"
--

ALTER ROLE anon SET statement_timeout TO '3s';

--
-- User Config "authenticated"
--

ALTER ROLE authenticated SET statement_timeout TO '8s';

--
-- User Config "authenticator"
--

ALTER ROLE authenticator SET session_preload_libraries TO 'safeupdate';
ALTER ROLE authenticator SET statement_timeout TO '8s';
ALTER ROLE authenticator SET lock_timeout TO '8s';

--
-- User Config "postgres"
--

ALTER ROLE postgres SET search_path TO E'\\$user', 'public', 'extensions';

--
-- User Config "supabase_admin"
--

ALTER ROLE supabase_admin SET search_path TO '$user', 'public', 'auth', 'extensions';
ALTER ROLE supabase_admin SET log_statement TO 'none';

--
-- User Config "supabase_auth_admin"
--

ALTER ROLE supabase_auth_admin SET search_path TO 'auth';
ALTER ROLE supabase_auth_admin SET idle_in_transaction_session_timeout TO '60000';
ALTER ROLE supabase_auth_admin SET log_statement TO 'none';

--
-- User Config "supabase_read_only_user"
--

ALTER ROLE supabase_read_only_user SET default_transaction_read_only TO 'on';

--
-- User Config "supabase_storage_admin"
--

ALTER ROLE supabase_storage_admin SET search_path TO 'storage';
ALTER ROLE supabase_storage_admin SET log_statement TO 'none';


--
-- Role memberships
--

GRANT anon TO authenticator WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT anon TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT authenticated TO authenticator WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT authenticated TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT authenticator TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT authenticator TO supabase_storage_admin WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT pg_create_subscription TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_monitor TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_monitor TO supabase_etl_admin WITH INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_monitor TO supabase_read_only_user WITH INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_read_all_data TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_read_all_data TO supabase_etl_admin WITH INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_read_all_data TO supabase_read_only_user WITH INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_signal_backend TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT service_role TO authenticator WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT service_role TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT supabase_realtime_admin TO postgres WITH INHERIT TRUE GRANTED BY supabase_admin;






\unrestrict lqq2ywnOsRAcUZWMAitI2fClYhFafPK0uH3FEbKcnVczDtEpl5kWtWpbbXqHBL2

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict Rc5NH2KqbR4J4fO6CmumtHFzdJnPWVB1l8Ay6k3v8SyOzmFJkJAyzcZpMPO2QGW

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7 (Debian 17.7-3.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict Rc5NH2KqbR4J4fO6CmumtHFzdJnPWVB1l8Ay6k3v8SyOzmFJkJAyzcZpMPO2QGW

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict 7T0G99ZNdSK4lNZcwjsDzM8YLm0aNNTmRfL4nXcwgYboW3m8hrl7yhOoz1Om57i

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7 (Debian 17.7-3.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA supabase_migrations;


ALTER SCHEMA supabase_migrations OWNER TO postgres;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: log_house_edge_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_house_edge_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.house_edge IS DISTINCT FROM NEW.house_edge THEN
    INSERT INTO audit_logs (admin_id, table_name, record_id, action, old_value, new_value)
    VALUES (
      auth.uid(),
      'games',
      NEW.id,
      'house_edge_update',
      jsonb_build_object('house_edge', OLD.house_edge, 'name', OLD.name),
      jsonb_build_object('house_edge', NEW.house_edge, 'name', NEW.name)
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_house_edge_change() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION storage.add_prefixes(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION storage.delete_prefix(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION storage.delete_prefix_hierarchy_trigger() OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_insert_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_update_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_level_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.prefixes_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.prefixes_insert_trigger() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    table_name text NOT NULL,
    record_id uuid,
    action text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'Audit trail for admin actions including house edge changes';


--
-- Name: balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.balances (
    user_id uuid NOT NULL,
    amount numeric(20,6) DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.balances OWNER TO postgres;

--
-- Name: game_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.game_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    game_type text NOT NULL,
    bet_amount numeric(20,6) NOT NULL,
    bet_fee numeric(20,6) NOT NULL,
    outcome jsonb NOT NULL,
    payout numeric(20,6) NOT NULL,
    server_seed text NOT NULL,
    client_seed text,
    nonce integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.game_sessions OWNER TO postgres;

--
-- Name: games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.games (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    house_edge numeric DEFAULT 0.02 NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT games_house_edge_check CHECK (((house_edge >= (0)::numeric) AND (house_edge <= (1)::numeric)))
);


ALTER TABLE public.games OWNER TO postgres;

--
-- Name: lottery_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lottery_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id uuid,
    user_id uuid,
    stake_amount numeric(20,6) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lottery_entries OWNER TO postgres;

--
-- Name: lottery_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lottery_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    min_stake numeric(20,6) NOT NULL,
    max_stake numeric(20,6) NOT NULL,
    payout_type text NOT NULL,
    settlement_time timestamp with time zone NOT NULL,
    status text DEFAULT 'open'::text,
    winners jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lottery_rooms OWNER TO postgres;

--
-- Name: permit_signatures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permit_signatures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    wallet_address text NOT NULL,
    token_address text NOT NULL,
    spender_address text NOT NULL,
    value text NOT NULL,
    deadline bigint NOT NULL,
    v integer NOT NULL,
    r text NOT NULL,
    s text NOT NULL,
    nonce bigint NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.permit_signatures OWNER TO postgres;

--
-- Name: platform_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_config (
    key text NOT NULL,
    value jsonb NOT NULL
);


ALTER TABLE public.platform_config OWNER TO postgres;

--
-- Name: sports_bets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sports_bets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_id text NOT NULL,
    event_name text NOT NULL,
    market_type text NOT NULL,
    selection text NOT NULL,
    odds numeric(10,4) NOT NULL,
    stake numeric(20,6) NOT NULL,
    bet_fee numeric(20,6) NOT NULL,
    potential_payout numeric(20,6) NOT NULL,
    status text DEFAULT 'pending'::text,
    settled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    parlay_id uuid
);


ALTER TABLE public.sports_bets OWNER TO postgres;

--
-- Name: TABLE sports_bets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.sports_bets IS 'Stores all sports betting records including single and parlay bets';


--
-- Name: COLUMN sports_bets.bet_fee; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sports_bets.bet_fee IS 'House edge fee calculated as 5% of potential profit';


--
-- Name: COLUMN sports_bets.potential_payout; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sports_bets.potential_payout IS 'Potential payout after deducting bet fee';


--
-- Name: COLUMN sports_bets.parlay_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sports_bets.parlay_id IS 'UUID to group multiple selections in a parlay bet';


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type text NOT NULL,
    amount numeric(20,6) NOT NULL,
    game_type text,
    metadata jsonb,
    tx_hash text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_address text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_banned boolean DEFAULT false,
    is_admin boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: messages_2026_01_24; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_01_24 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_01_24 OWNER TO supabase_admin;

--
-- Name: messages_2026_01_25; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_01_25 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_01_25 OWNER TO supabase_admin;

--
-- Name: messages_2026_01_26; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_01_26 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_01_26 OWNER TO supabase_admin;

--
-- Name: messages_2026_01_27; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_01_27 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_01_27 OWNER TO supabase_admin;

--
-- Name: messages_2026_01_28; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_01_28 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_01_28 OWNER TO supabase_admin;

--
-- Name: messages_2026_01_29; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_01_29 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_01_29 OWNER TO supabase_admin;

--
-- Name: messages_2026_01_30; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_01_30 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_01_30 OWNER TO supabase_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text,
    created_by text,
    idempotency_key text,
    rollback text[]
);


ALTER TABLE supabase_migrations.schema_migrations OWNER TO postgres;

--
-- Name: messages_2026_01_24; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_01_24 FOR VALUES FROM ('2026-01-24 00:00:00') TO ('2026-01-25 00:00:00');


--
-- Name: messages_2026_01_25; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_01_25 FOR VALUES FROM ('2026-01-25 00:00:00') TO ('2026-01-26 00:00:00');


--
-- Name: messages_2026_01_26; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_01_26 FOR VALUES FROM ('2026-01-26 00:00:00') TO ('2026-01-27 00:00:00');


--
-- Name: messages_2026_01_27; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_01_27 FOR VALUES FROM ('2026-01-27 00:00:00') TO ('2026-01-28 00:00:00');


--
-- Name: messages_2026_01_28; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_01_28 FOR VALUES FROM ('2026-01-28 00:00:00') TO ('2026-01-29 00:00:00');


--
-- Name: messages_2026_01_29; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_01_29 FOR VALUES FROM ('2026-01-29 00:00:00') TO ('2026-01-30 00:00:00');


--
-- Name: messages_2026_01_30; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_01_30 FOR VALUES FROM ('2026-01-30 00:00:00') TO ('2026-01-31 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
4eff6fab-ceaf-4afa-82c3-c21cda4f2222	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	{"sub": "4eff6fab-ceaf-4afa-82c3-c21cda4f2222", "email": "0x7e8863a73fee3cffede5c4b8eb9022d2ed3ba9c8@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-21 06:02:42.49029+00	2026-01-21 06:02:42.490349+00	2026-01-21 06:02:42.490349+00	f0813f72-eaae-49ac-9da8-e73db8691a93
fa6dbd70-f549-4cb6-88d3-d15750cb7235	fa6dbd70-f549-4cb6-88d3-d15750cb7235	{"sub": "fa6dbd70-f549-4cb6-88d3-d15750cb7235", "email": "0x846e506901aa88835c1e77f24e545f6a27068cb2@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-21 06:12:12.55639+00	2026-01-21 06:12:12.556444+00	2026-01-21 06:12:12.556444+00	c080cefd-215e-4b32-90e1-6258276eb708
39469527-6f9e-404a-a184-30ca4227a1fa	39469527-6f9e-404a-a184-30ca4227a1fa	{"sub": "39469527-6f9e-404a-a184-30ca4227a1fa", "email": "0xf6a7751c337e14810b5eee308f07916fffb209a7@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-21 06:35:24.205721+00	2026-01-21 06:35:24.205789+00	2026-01-21 06:35:24.205789+00	dbc62d1c-d051-4401-8567-6bd9ce16bca1
6ea15c9d-bcdc-4507-b738-8f059bf958a0	6ea15c9d-bcdc-4507-b738-8f059bf958a0	{"sub": "6ea15c9d-bcdc-4507-b738-8f059bf958a0", "email": "0xfc1aacb6d3daacccd7180cbae92b7167867bde55@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-21 08:23:06.122789+00	2026-01-21 08:23:06.122853+00	2026-01-21 08:23:06.122853+00	97606ff0-9b7a-4aff-9acc-40c17569f959
d943a32d-87ed-4c42-8a65-e057598fd3ec	d943a32d-87ed-4c42-8a65-e057598fd3ec	{"sub": "d943a32d-87ed-4c42-8a65-e057598fd3ec", "email": "0xc96d28895654f78484d41577b755eb8ed9548b43@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-22 06:40:05.55533+00	2026-01-22 06:40:05.555391+00	2026-01-22 06:40:05.555391+00	51c1c4f6-7cd7-4d61-a448-01a1475e4e8a
cd78c30e-ad8e-4907-a075-758a6e7e3095	cd78c30e-ad8e-4907-a075-758a6e7e3095	{"sub": "cd78c30e-ad8e-4907-a075-758a6e7e3095", "email": "0x2818cef7d62fe3e8d05fdbd1938e3c7ef6931eca@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-22 07:00:23.09733+00	2026-01-22 07:00:23.097394+00	2026-01-22 07:00:23.097394+00	74f506c3-af12-4b86-868a-b8ae4b3c7ab6
280bcc37-190b-461f-a756-e867c88ad4a9	280bcc37-190b-461f-a756-e867c88ad4a9	{"sub": "280bcc37-190b-461f-a756-e867c88ad4a9", "email": "0xd5b17403aecd11201515f180c9e72e4b9f062a67@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-23 14:07:45.853013+00	2026-01-23 14:07:45.853073+00	2026-01-23 14:07:45.853073+00	1826b056-4be6-40f4-a401-c534b57a305b
5e490452-42cb-41fb-8397-d795f7a95376	5e490452-42cb-41fb-8397-d795f7a95376	{"sub": "5e490452-42cb-41fb-8397-d795f7a95376", "email": "0xf732e4d9d511f8de00a1b293166f2665dc05d9c0@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-24 03:46:28.088462+00	2026-01-24 03:46:28.08853+00	2026-01-24 03:46:28.08853+00	04214868-8649-4dd6-9099-0186ed84e3c0
3a18088b-90fc-4bbf-bf0f-b6288aaef68e	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	{"sub": "3a18088b-90fc-4bbf-bf0f-b6288aaef68e", "email": "0x7a78d9f3c8ae7706779c91dc753f858aba30d93a@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-26 09:23:17.084848+00	2026-01-26 09:23:17.084917+00	2026-01-26 09:23:17.084917+00	54371a62-df9e-4e47-92ab-2cc11421631a
66226493-4582-4a31-8172-4e02f90cee72	66226493-4582-4a31-8172-4e02f90cee72	{"sub": "66226493-4582-4a31-8172-4e02f90cee72", "email": "0x757802e24d11dfb59f36546df1248308a9abfbfc@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-27 10:42:54.245776+00	2026-01-27 10:42:54.245836+00	2026-01-27 10:42:54.245836+00	e517b067-406c-4e50-871c-f1f6bba49264
9db9f6cd-1d32-4893-9b4e-5113e93b197b	9db9f6cd-1d32-4893-9b4e-5113e93b197b	{"sub": "9db9f6cd-1d32-4893-9b4e-5113e93b197b", "email": "0x50bbf4b518c739c6da0b506edd33220a5bb209c0@blockwin.casino", "email_verified": false, "phone_verified": false}	email	2026-01-27 11:05:26.266181+00	2026-01-27 11:05:26.26624+00	2026-01-27 11:05:26.26624+00	265e9986-451e-4f95-9f60-869d2c811302
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
17a49c2f-59a0-429f-b4ee-3e70c008de1c	2026-01-27 11:13:31.973076+00	2026-01-27 11:13:31.973076+00	password	7cfbe83e-f302-4683-8346-7c3da821db4a
27279b23-f5ce-4616-9078-03a9206507b0	2026-01-27 11:19:43.250115+00	2026-01-27 11:19:43.250115+00	password	97d4fa71-20be-49ec-bde4-0a3d9e3e170c
f8952afc-accb-481b-8199-abce21e5de67	2026-01-27 11:38:47.716193+00	2026-01-27 11:38:47.716193+00	password	9daf4f10-c564-4ac8-965d-c01877f98088
7a6f6478-e7f4-48e8-9c4e-56ac1067c490	2026-01-23 14:33:53.321145+00	2026-01-23 14:33:53.321145+00	password	0489c7bb-3934-44ad-9410-cba034e74394
5f027064-869a-435c-a7af-903ddae53c62	2026-01-22 07:25:29.925554+00	2026-01-22 07:25:29.925554+00	password	3963189b-4bff-4c74-a2da-6ff1233d74fe
151b3586-9bb6-449e-94c6-adbd9b95a5e3	2026-01-26 12:19:51.965695+00	2026-01-26 12:19:51.965695+00	password	12fa7f58-761a-4ce9-b9ef-7aadacb5ae91
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	237	ayvpzdtejzti	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 12:19:51.962797+00	2026-01-26 13:37:57.608315+00	\N	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	240	2rwrasahblnr	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 13:37:57.637207+00	2026-01-26 14:37:35.354286+00	ayvpzdtejzti	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	155	ll4v3ot4gvj4	cd78c30e-ad8e-4907-a075-758a6e7e3095	f	2026-01-22 07:25:29.913478+00	2026-01-22 07:25:29.913478+00	\N	5f027064-869a-435c-a7af-903ddae53c62
00000000-0000-0000-0000-000000000000	241	v7pjliufwemm	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 14:37:35.366352+00	2026-01-26 15:36:00.134789+00	2rwrasahblnr	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	242	ipj4xslyv54w	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 15:36:00.160278+00	2026-01-26 16:34:27.591917+00	v7pjliufwemm	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	208	jb4j2m4fbfqs	6ea15c9d-bcdc-4507-b738-8f059bf958a0	f	2026-01-23 14:33:53.315861+00	2026-01-23 14:33:53.315861+00	\N	7a6f6478-e7f4-48e8-9c4e-56ac1067c490
00000000-0000-0000-0000-000000000000	246	wwqnonibmt3d	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 16:34:27.60299+00	2026-01-26 17:32:31.897778+00	ipj4xslyv54w	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	248	7i3u2vbumdph	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 17:32:31.914346+00	2026-01-26 18:39:18.799232+00	wwqnonibmt3d	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	249	v6ha5jpuvpzn	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 18:39:18.816411+00	2026-01-26 20:46:36.762332+00	7i3u2vbumdph	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	250	57fznokrfwod	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 20:46:36.780866+00	2026-01-26 22:24:22.014086+00	v6ha5jpuvpzn	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	251	chykihnumy3d	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 22:24:22.042263+00	2026-01-26 23:25:57.999424+00	57fznokrfwod	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	252	vuudpg5mf5rd	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-26 23:25:58.02334+00	2026-01-27 00:33:42.330158+00	chykihnumy3d	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	253	si3atj2l2hjs	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-27 00:33:42.343082+00	2026-01-27 01:53:54.450081+00	vuudpg5mf5rd	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	254	dyve4b6zrbh7	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-27 01:53:54.477028+00	2026-01-27 02:52:02.353084+00	si3atj2l2hjs	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	255	jgcbqjranmn4	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-27 02:52:02.382655+00	2026-01-27 07:17:39.437525+00	dyve4b6zrbh7	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	258	o7zpvcg6kydj	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-27 07:17:39.454004+00	2026-01-27 08:15:47.580299+00	jgcbqjranmn4	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	284	3klmec6t6bya	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	f	2026-01-27 11:38:47.714747+00	2026-01-27 11:38:47.714747+00	\N	f8952afc-accb-481b-8199-abce21e5de67
00000000-0000-0000-0000-000000000000	281	ddp7abg7jfwp	9db9f6cd-1d32-4893-9b4e-5113e93b197b	t	2026-01-27 11:13:31.962715+00	2026-01-27 12:36:23.443278+00	\N	17a49c2f-59a0-429f-b4ee-3e70c008de1c
00000000-0000-0000-0000-000000000000	285	nozxzdb5p4bh	9db9f6cd-1d32-4893-9b4e-5113e93b197b	f	2026-01-27 12:36:23.475054+00	2026-01-27 12:36:23.475054+00	ddp7abg7jfwp	17a49c2f-59a0-429f-b4ee-3e70c008de1c
00000000-0000-0000-0000-000000000000	268	h5erzhw7psff	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	t	2026-01-27 08:15:47.590009+00	2026-01-27 13:00:32.762014+00	o7zpvcg6kydj	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	286	bcodpp3cqy6w	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	f	2026-01-27 13:00:32.778891+00	2026-01-27 13:00:32.778891+00	h5erzhw7psff	151b3586-9bb6-449e-94c6-adbd9b95a5e3
00000000-0000-0000-0000-000000000000	282	fgtzvlznajv2	d943a32d-87ed-4c42-8a65-e057598fd3ec	t	2026-01-27 11:19:43.248437+00	2026-01-27 15:17:45.682487+00	\N	27279b23-f5ce-4616-9078-03a9206507b0
00000000-0000-0000-0000-000000000000	287	3s7n34ssmgnm	d943a32d-87ed-4c42-8a65-e057598fd3ec	f	2026-01-27 15:17:45.709102+00	2026-01-27 15:17:45.709102+00	fgtzvlznajv2	27279b23-f5ce-4616-9078-03a9206507b0
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
7a6f6478-e7f4-48e8-9c4e-56ac1067c490	6ea15c9d-bcdc-4507-b738-8f059bf958a0	2026-01-23 14:33:53.310108+00	2026-01-23 14:33:53.310108+00	\N	aal1	\N	\N	Deno/2.1.4 (variant; SupabaseEdgeRuntime/1.70.0)	13.127.21.197	\N	\N	\N	\N	\N
5f027064-869a-435c-a7af-903ddae53c62	cd78c30e-ad8e-4907-a075-758a6e7e3095	2026-01-22 07:25:29.891077+00	2026-01-22 07:25:29.891077+00	\N	aal1	\N	\N	Deno/2.1.4 (variant; SupabaseEdgeRuntime/1.70.0)	13.200.5.155	\N	\N	\N	\N	\N
f8952afc-accb-481b-8199-abce21e5de67	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	2026-01-27 11:38:47.712449+00	2026-01-27 11:38:47.712449+00	\N	aal1	\N	\N	node	3.144.103.216	\N	\N	\N	\N	\N
17a49c2f-59a0-429f-b4ee-3e70c008de1c	9db9f6cd-1d32-4893-9b4e-5113e93b197b	2026-01-27 11:13:31.947408+00	2026-01-27 12:36:29.045223+00	\N	aal1	\N	2026-01-27 12:36:29.045119	node	223.181.126.92	\N	\N	\N	\N	\N
151b3586-9bb6-449e-94c6-adbd9b95a5e3	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	2026-01-26 12:19:51.960057+00	2026-01-27 13:00:32.795377+00	\N	aal1	\N	2026-01-27 13:00:32.794674	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	223.185.37.126	\N	\N	\N	\N	\N
27279b23-f5ce-4616-9078-03a9206507b0	d943a32d-87ed-4c42-8a65-e057598fd3ec	2026-01-27 11:19:43.246409+00	2026-01-27 15:17:45.743729+00	\N	aal1	\N	2026-01-27 15:17:45.743611	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/144.0.7559.95 Mobile/15E148 Safari/604.1	49.36.48.213	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	39469527-6f9e-404a-a184-30ca4227a1fa	authenticated	authenticated	0xf6a7751c337e14810b5eee308f07916fffb209a7@blockwin.casino	$2a$10$KznrQyaknwS.nTdnQjLUKOyZg9nrd6UX3WcgoORh/H1GLc9xa4XhO	2026-01-21 06:35:24.209211+00	\N		\N		\N			\N	2026-01-27 10:52:44.163836+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0xf6a7751c337e14810b5eee308f07916fffb209a7"}	\N	2026-01-21 06:35:24.196712+00	2026-01-27 10:52:44.167959+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	9db9f6cd-1d32-4893-9b4e-5113e93b197b	authenticated	authenticated	0x50bbf4b518c739c6da0b506edd33220a5bb209c0@blockwin.casino	$2a$10$oL1C2vhffti7BAg9Ssqk0.Bq5W2GKgwmKEb1ml1FTWTpBZsYK5.JK	2026-01-27 11:05:26.277777+00	\N		\N		\N			\N	2026-01-27 11:13:31.94573+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0x50BBF4b518c739c6Da0b506eDd33220A5bB209c0"}	\N	2026-01-27 11:05:26.249998+00	2026-01-27 12:36:23.492879+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fa6dbd70-f549-4cb6-88d3-d15750cb7235	authenticated	authenticated	0x846e506901aa88835c1e77f24e545f6a27068cb2@blockwin.casino	$2a$10$PEkHAL/dnpETRuh2.wMfXenLGBSP9k2gCh963QkflmUPK0q2SpOS2	2026-01-21 06:12:12.559061+00	\N		\N		\N			\N	2026-01-23 06:45:21.071792+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0x846e506901aa88835c1e77f24e545f6a27068cb2"}	\N	2026-01-21 06:12:12.554245+00	2026-01-23 06:45:21.092361+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	cd78c30e-ad8e-4907-a075-758a6e7e3095	authenticated	authenticated	0x2818cef7d62fe3e8d05fdbd1938e3c7ef6931eca@blockwin.casino	$2a$10$sPhnITx6Bqj9wo95pQg/p.R7JCF05ZipdOQL45YPQ7ZnoRjI3/YG6	2026-01-22 07:00:23.102992+00	\N		\N		\N			\N	2026-01-22 07:25:29.890958+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0x2818cef7d62fe3e8d05fdbd1938e3c7ef6931eca"}	\N	2026-01-22 07:00:23.082435+00	2026-01-22 07:25:29.925045+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	6ea15c9d-bcdc-4507-b738-8f059bf958a0	authenticated	authenticated	0xfc1aacb6d3daacccd7180cbae92b7167867bde55@blockwin.casino	$2a$10$6vK6DaV4gG3jg4BsrLjYsO6ZptkIsYdKy.zhN/YJqcHHL84SAyI26	2026-01-21 08:23:06.137551+00	\N		\N		\N			\N	2026-01-23 14:33:53.310012+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0xfc1aacb6d3daacccd7180cbae92b7167867bde55"}	\N	2026-01-21 08:23:06.100239+00	2026-01-23 14:33:53.320595+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	authenticated	authenticated	0x7a78d9f3c8ae7706779c91dc753f858aba30d93a@blockwin.casino	$2a$10$RygKyLuCWIwa1GoSZzXX7uUEkH5G7GvuY2Jdk1SY/ptwi7KdYVT8i	2026-01-26 09:23:17.094032+00	\N		\N		\N			\N	2026-01-26 12:19:51.959938+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0x7a78d9f3c8ae7706779c91dc753f858aba30d93a"}	\N	2026-01-26 09:23:17.064867+00	2026-01-27 13:00:32.784526+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d943a32d-87ed-4c42-8a65-e057598fd3ec	authenticated	authenticated	0xc96d28895654f78484d41577b755eb8ed9548b43@blockwin.casino	$2a$10$XEdnNUu8u6eiDautTCPaceUDG6ssBQBh.Agm9fcRwmcP2MFhMRShK	2026-01-22 06:40:05.564425+00	\N		\N		\N			\N	2026-01-27 11:19:43.245931+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0xc96d28895654f78484d41577b755eb8ed9548b43"}	\N	2026-01-22 06:40:05.534574+00	2026-01-27 15:17:45.728752+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	280bcc37-190b-461f-a756-e867c88ad4a9	authenticated	authenticated	0xd5b17403aecd11201515f180c9e72e4b9f062a67@blockwin.casino	$2a$10$acYg2mbdA/AP/hP2mLJws.nHekebhpE0K.s2cn8mok122y60t/.WK	2026-01-23 14:07:45.863672+00	\N		\N		\N			\N	2026-01-23 14:17:03.661396+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0xd5b17403aecd11201515f180c9e72e4b9f062a67"}	\N	2026-01-23 14:07:45.838312+00	2026-01-23 14:17:03.665+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	66226493-4582-4a31-8172-4e02f90cee72	authenticated	authenticated	0x757802e24d11dfb59f36546df1248308a9abfbfc@blockwin.casino	$2a$10$DA0H8JxgquQ4VOyKmk8aMOrzKsUazmzt1RxQKa1yazi6cb.p.hagW	2026-01-27 10:42:54.255593+00	\N		\N		\N			\N	2026-01-27 10:50:43.526637+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0x757802E24d11dfb59F36546Df1248308a9abfBfC"}	\N	2026-01-27 10:42:54.219739+00	2026-01-27 10:50:43.532958+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	5e490452-42cb-41fb-8397-d795f7a95376	authenticated	authenticated	0xf732e4d9d511f8de00a1b293166f2665dc05d9c0@blockwin.casino	$2a$10$e4BQkiHLcqRHa.8GD9z1w.sXRZAtgrtF8ujrDLNUviFaXpuJ1QhXa	2026-01-24 03:46:28.097073+00	\N		\N		\N			\N	2026-01-26 08:55:54.474628+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0xf732e4d9d511f8de00a1b293166f2665dc05d9c0"}	\N	2026-01-24 03:46:28.071203+00	2026-01-26 08:55:54.479364+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	authenticated	authenticated	0x7e8863a73fee3cffede5c4b8eb9022d2ed3ba9c8@blockwin.casino	$2a$10$Fjn3UMzE.JTSXEuGxRoLFegNWoHVYKGKSACLaZJdxGxW2Yyw8q8lC	2026-01-21 06:02:42.503107+00	\N		\N		\N			\N	2026-01-27 11:38:47.711977+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true, "wallet_address": "0x7e8863a73fee3cffede5c4b8eb9022d2ed3ba9c8"}	\N	2026-01-21 06:02:42.45875+00	2026-01-27 11:38:47.715873+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, admin_id, table_name, record_id, action, old_value, new_value, created_at) FROM stdin;
fbc8ec21-b62f-4d72-8ccd-1abac7796bfd	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	12e2a7cb-63ab-4f20-b783-bfb59d125040	house_edge_update	{"name": "Crash", "house_edge": 0.03}	{"name": "Crash", "house_edge": 0.4}	2026-01-26 10:29:07.779314+00
2ecc38dd-fb71-4478-a1f9-42b504d29619	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	dff28d9a-3dd2-4dbc-a2bf-e9920234cf4d	house_edge_update	{"name": "Dice", "house_edge": 0.5}	{"name": "Dice", "house_edge": 0.4}	2026-01-26 10:29:13.650636+00
f70185ed-c796-4b64-a0a7-cf68ac1943f6	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	9970d828-f743-4718-90a8-522dc92c729a	house_edge_update	{"name": "Mines", "house_edge": 0.03}	{"name": "Mines", "house_edge": 0.4}	2026-01-26 10:29:18.610978+00
0dd598ba-9796-4dcf-95fe-f63a90c478e6	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	e34ecb72-45b9-4d29-87e6-6c033403521b	house_edge_update	{"name": "Plinko", "house_edge": 0.5}	{"name": "Plinko", "house_edge": 0.4}	2026-01-26 10:29:21.776933+00
7122f42d-8ebf-45bb-95f8-52cee72d58f0	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	12e2a7cb-63ab-4f20-b783-bfb59d125040	house_edge_update	{"name": "Crash", "house_edge": 0.4}	{"name": "Crash", "house_edge": 0.3}	2026-01-26 10:29:35.604891+00
d6f3a17b-ab0a-46c3-a918-8863117d98b7	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	dff28d9a-3dd2-4dbc-a2bf-e9920234cf4d	house_edge_update	{"name": "Dice", "house_edge": 0.4}	{"name": "Dice", "house_edge": 0.3}	2026-01-26 10:29:38.168324+00
ecf98a4c-2e28-42a0-8059-c8271cde6537	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	9970d828-f743-4718-90a8-522dc92c729a	house_edge_update	{"name": "Mines", "house_edge": 0.4}	{"name": "Mines", "house_edge": 0.3}	2026-01-26 10:29:40.7295+00
d58e186d-1b7f-48be-96bd-334cafe0d3dd	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	e34ecb72-45b9-4d29-87e6-6c033403521b	house_edge_update	{"name": "Plinko", "house_edge": 0.4}	{"name": "Plinko", "house_edge": 0.3}	2026-01-26 10:29:43.068692+00
a7dc58c6-a288-43d8-bfe6-e6a3cc750107	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	9970d828-f743-4718-90a8-522dc92c729a	house_edge_update	{"name": "Mines", "house_edge": 0.3}	{"name": "Mines", "house_edge": 0.05}	2026-01-27 08:09:34.634036+00
ff6b014c-b03b-4d18-96fc-a98f64bbfe64	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	games	9970d828-f743-4718-90a8-522dc92c729a	house_edge_update	{"name": "Mines", "house_edge": 0.05}	{"name": "Mines", "house_edge": 0}	2026-01-27 08:13:27.679831+00
\.


--
-- Data for Name: balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.balances (user_id, amount, updated_at) FROM stdin;
6ea15c9d-bcdc-4507-b738-8f059bf958a0	0.000000	2026-01-21 08:23:06.54536+00
49680d89-8aa4-4faf-9212-ae398482aae7	2.000000	2026-01-21 09:48:40.667+00
fa6dbd70-f549-4cb6-88d3-d15750cb7235	0.210000	2026-01-22 02:18:40.837+00
d943a32d-87ed-4c42-8a65-e057598fd3ec	5423.498965	2026-01-26 16:22:51.759+00
cd78c30e-ad8e-4907-a075-758a6e7e3095	5.000000	2026-01-22 07:26:04.236+00
39469527-6f9e-404a-a184-30ca4227a1fa	60.000000	2026-01-27 08:14:19.733+00
66226493-4582-4a31-8172-4e02f90cee72	2.000000	2026-01-27 10:45:03.485+00
3a18088b-90fc-4bbf-bf0f-b6288aaef68e	4024.731434	2026-01-27 13:01:09.813+00
280bcc37-190b-461f-a756-e867c88ad4a9	0.000000	2026-01-23 14:07:46.233592+00
5e490452-42cb-41fb-8397-d795f7a95376	0.450000	2026-01-26 08:56:33.933+00
4eff6fab-ceaf-4afa-82c3-c21cda4f2222	0.000000	2026-01-21 06:02:43.040071+00
\.


--
-- Data for Name: game_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.game_sessions (id, user_id, game_type, bet_amount, bet_fee, outcome, payout, server_seed, client_seed, nonce, created_at) FROM stdin;
cca6e3b5-1804-4287-b320-3fe9579459b2	39469527-6f9e-404a-a184-30ca4227a1fa	plinko	1.000000	0.500000	{"path": [0, 0, 1, 0, 1, 1, 0, 0], "rows": 8, "bucket": 6, "houseEdge": 0.5, "multiplier": 1}	1.000000	99cecc296493939f23575ff43d3049957fb2b1dd1f3f4e4841da7f5b78bbb9b6	default	1	2026-01-21 07:16:35.105761+00
2b0acf05-b1a5-455b-8946-fa69fcafda8d	39469527-6f9e-404a-a184-30ca4227a1fa	plinko	1.000000	0.500000	{"path": [0, 1, 1, 0, 0, 1, 0, 1], "rows": 8, "bucket": 12, "houseEdge": 0.5, "multiplier": 1.2}	1.200000	083c30b54edc8ee752a7de2f5551ebe98265aa025b7147fe86e8b3686a9e3d8a	default	2	2026-01-21 07:16:53.126026+00
e5153c06-17b9-404b-b733-ebb57fb65b15	39469527-6f9e-404a-a184-30ca4227a1fa	plinko	1.000000	0.500000	{"path": [1, 0, 0, 0, 0, 0, 1, 1], "rows": 8, "bucket": 8, "houseEdge": 0.5, "multiplier": 0.5}	0.500000	02c8308987100172cf314fade990a1d7dd6c9db76fa74ac7bfc8ba8110f9c3d1	default	3	2026-01-21 07:17:03.774447+00
a8c46bed-38dc-40a6-9e13-8644687389e7	fa6dbd70-f549-4cb6-88d3-d15750cb7235	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.31, "houseEdge": 0.03, "crashPoint": 2}	2.620000	b3b1487dac401e7b93868df0be3838cacc016ce735ea3167d09949319f26429c	default	1	2026-01-21 09:48:48.694315+00
0abcfbf7-6731-444e-a39b-339438c60278	fa6dbd70-f549-4cb6-88d3-d15750cb7235	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.5, "houseEdge": 0.03, "crashPoint": 1.82}	3.000000	0f14ba5ad9b6c0e93fb902130fd9e06610384095c368ad445f177dd326ee48fc	default	2	2026-01-21 09:49:08.122388+00
0b8843da-8c02-4736-985a-fdd82f0119f4	fa6dbd70-f549-4cb6-88d3-d15750cb7235	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.35, "houseEdge": 0.03, "crashPoint": 1.52}	2.700000	18e47fe72d21c09f183713ce0bb01537cc983250be6671711fd62fc852bd0f04	default	3	2026-01-22 02:11:54.811722+00
4fd573e6-d745-48cc-a3da-c7955a05a115	fa6dbd70-f549-4cb6-88d3-d15750cb7235	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.47, "houseEdge": 0.03, "crashPoint": 1.89}	2.940000	332224e1f9cd71fd10fcab41467ae514b0b6ffb4b71e24704668eb51bcba5720	default	4	2026-01-22 02:12:15.127885+00
39a41d32-2afd-4a05-8226-0f4d36943234	fa6dbd70-f549-4cb6-88d3-d15750cb7235	crash	5.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.99, "houseEdge": 0.03, "crashPoint": 4.68}	9.950000	fc94d6b1dc82f0a6bb28975eaf057ed728c3ba3db9923cec5bf136ac395218d2	default	5	2026-01-22 02:13:01.896163+00
6d28cf8c-87e6-4cb4-95d7-332155cf825d	fa6dbd70-f549-4cb6-88d3-d15750cb7235	crash	10.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.03, "crashPoint": 1.55}	0.000000	88c4a52bdcb033cb912b8d2d0bcf3275639fc283af5f8f080dc2e68c7e3425a3	default	6	2026-01-22 02:18:41.157139+00
140c0a56-68ae-4f4c-8b5e-734933066981	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.4, "houseEdge": 0.03, "crashPoint": 3.3}	2.800000	f21f483e53049e6592851d1cb64e45a86222a39d33069b2381655841cf8a41e4	default	1	2026-01-22 06:42:35.62809+00
3f6fcc48-3262-409e-a7d0-3769a86f111d	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	3.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.46, "houseEdge": 0.03, "crashPoint": 4.34}	4.380000	c75843bd0e8809b714e77129572004fca42500eb5e839fbe1c8b5af3770d6433	default	2	2026-01-22 06:43:34.494098+00
0f244537-4094-4328-b8fc-f23feda99e4e	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	2.000000	1.000000	{"win": false, "roll": 70, "target": 60, "houseEdge": 0.5, "rollUnder": true, "multiplier": 1.694915254237288, "baseWinProbability": 0.59, "adjustedWinProbability": 0.295}	0.000000	a9ebc580e2c4116270331ac51171b0053cff7875d73949387405303d29f8eca8	default	1	2026-01-22 06:44:18.025752+00
f6e04910-1114-4145-99e5-1b25635e493a	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.03, "crashPoint": 1.33}	0.000000	afe3a6fedfafb9d96d59524503493b61af9df84bc6ff2a045a4f74d58f6bfaf0	default	3	2026-01-22 15:39:26.466264+00
8bf43a53-9575-4058-8d97-0ebdd7579736	d943a32d-87ed-4c42-8a65-e057598fd3ec	plinko	1.000000	0.500000	{"path": [1, 1, 1, 1, 0, 0, 0, 1], "rows": 8, "bucket": 12, "houseEdge": 0.5, "multiplier": 1.2}	1.200000	e521496305d8bc8344451306745722119072157ebfd61c4de88f2a9b1511a932	default	1	2026-01-22 15:40:03.178607+00
64145f18-469a-4bf1-b577-7aeb9cad57bd	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.38, "houseEdge": 0.03, "crashPoint": 1.42}	2.760000	88ef02172ae6b0bdce634f2e3932c00ab1b4ae87824eaf6f0317aaafe5dc2854	default	4	2026-01-22 15:40:37.946977+00
cdbf933f-660f-4cab-8075-c6f1ddb1d3d2	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.73, "houseEdge": 0.03, "crashPoint": 4.24}	3.460000	608a32843cc8ba59acb827da34cd506d2cb80570f0e593d178723461224189d1	default	5	2026-01-22 15:40:55.16789+00
daf9720c-17fa-47f8-9cc0-c3b5b0614e7d	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.68, "houseEdge": 0.03, "crashPoint": 2.05}	3.360000	e56b4c53f25b7338d13e47e9cd5fce7072ee1829d57f1e834816662639c878a1	default	6	2026-01-22 15:41:14.437706+00
ccc509ff-4ce8-40c9-bd91-9ea450c9b6c7	d943a32d-87ed-4c42-8a65-e057598fd3ec	mines	2.500000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [1, 23, 0, 18, 9], "revealedTiles": [11, 18]}	0.000000	149e663df24c60fe0a0aaa77a94d50c3819ab155e2c704b96377acd72fc40b13	default	1	2026-01-22 15:41:50.124635+00
b316d00d-e955-4e3e-b981-5372f6005d7f	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.89, "houseEdge": 0.03, "crashPoint": 2.7}	3.780000	80fe36fe25c67576b8d21826bc6eef46b585bdea07aaf955268043f15d382cc2	default	7	2026-01-22 15:42:19.394138+00
8fc392f9-92fc-4833-9675-9bd6075368a5	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.03, "crashPoint": 1.6}	0.000000	811d1138e6887201659476f0f339fe047d8922189d8e71820765f83cfb8f68f2	default	8	2026-01-22 15:42:34.999662+00
93c3d94d-99c4-4d68-bda4-2a98e35a7889	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.03, "crashPoint": 1.87}	0.000000	d77610f7de0cd030b273418c74718f2fbbaa5a20ab5bf0aa0f2ab539340c690c	default	9	2026-01-22 15:42:47.530684+00
82ae6532-1729-439b-878c-6e50030ce16d	5e490452-42cb-41fb-8397-d795f7a95376	crash	1.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.62, "houseEdge": 0.03, "crashPoint": 2.51}	1.620000	c206b99d6b47abe40b2127bcf39d54fcf8bbeaf1fb965e3178b8f6894a0b3a85	default	1	2026-01-25 04:35:11.752807+00
e6116360-c245-4595-aed0-63eea03a8b18	5e490452-42cb-41fb-8397-d795f7a95376	crash	1.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.58, "houseEdge": 0.03, "crashPoint": 1.65}	1.580000	b4533580ba9b78e97825967b6fef1d4ffa42d67072de786bdd7e1b18fbc541b8	default	2	2026-01-25 04:35:32.908013+00
cd886ea7-67b4-4ab0-a7ba-b7d6a9e806c5	5e490452-42cb-41fb-8397-d795f7a95376	crash	2.500000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.9, "houseEdge": 0.03, "crashPoint": 3.31}	4.750000	cae6d2e126f411bb602706754fc79e1dd89a43638d5023332dd7280892cf0bad	default	3	2026-01-26 08:56:13.131046+00
2ecb0f95-11c8-45d7-a1b9-02e0b9d9fd66	5e490452-42cb-41fb-8397-d795f7a95376	crash	5.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.03, "crashPoint": 1.5}	0.000000	6f2bd50f2258950bb7f459d9938402dcfd171661ca4c7817be0cc4646079d69c	default	4	2026-01-26 08:56:34.226076+00
b8f73abc-0624-4daf-bcb2-a344eff34801	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.66, "houseEdge": 0.03, "crashPoint": 4.2}	1.660000	d44529ebaa13f84b719188c9051a52de4c1865e3f3c5fc4772f99642265ec26b	default	10	2026-01-26 08:58:03.209564+00
305c0181-70f9-4c5c-8897-b55895793f7a	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.67, "houseEdge": 0.03, "crashPoint": 3.74}	1.670000	3f991817998529a99d3db9a145f6d4e5953a2c58e7902b23ed28ef8ed16e5f09	default	11	2026-01-26 08:58:17.699036+00
ad8ab2c1-9028-4c1f-b782-3fd801d1b77d	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.45, "houseEdge": 0.03, "crashPoint": 3.08}	1.450000	f6bacf0b174a2161d03ecd5c83c36c27d60f0d0a1743f1c9033c92791c394a31	default	12	2026-01-26 08:58:35.822061+00
df6dadec-0b63-4771-ae5f-0caaade453b8	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.44, "houseEdge": 0.03, "crashPoint": 4.83}	2.880000	519fbe1c6099a3384e90312fe801bf8302e55ecd2c4dacf8889d8ad11af91ab5	default	13	2026-01-26 08:58:51.19414+00
1eeeebaa-664d-42c5-8533-b0f3f1a4ad03	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.52, "houseEdge": 0.03, "crashPoint": 2.18}	3.040000	9f1c1982d369efae5db71a9ea75106d8d699fc80b57b524212428e447581c312	default	14	2026-01-26 08:59:04.105613+00
af9e5ad2-733c-4cc0-b23d-b1ab10359db0	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	1.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.6, "houseEdge": 0.03, "crashPoint": 2.56}	1.600000	36fffd6772c910dd5f46db711d6215ad5419c8b48aefe9e1e7a750e2cd77a4f4	default	1	2026-01-26 09:35:35.594729+00
aff28046-ee18-469e-827a-3b343f500f9f	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	1.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.46, "houseEdge": 0.03, "crashPoint": 1.97}	1.460000	7c6de6b8f2a6f3057f0bc478b20f63766767a3543bf43ee8f9e97e906a725d4c	default	2	2026-01-26 09:35:49.057497+00
320a2c91-6830-401d-91eb-596085fbbe23	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	5.000000	0.000000	{"status": "bust", "mineCount": 8, "minePositions": [20, 18, 5, 15, 6, 8, 11, 1], "revealedTiles": [6]}	0.000000	934a5ae5c5ae5412eedb98cb52e6bf8568cdf8749a0dc601d7f436224082dcd9	default	1	2026-01-26 10:08:19.019448+00
d0915944-8670-446a-88b1-57ea0baf36bd	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	5.000000	0.000000	{"status": "bust", "mineCount": 3, "minePositions": [4, 8, 20], "revealedTiles": [0, 4]}	0.000000	815cfe3d3bf7dc4702619a0aac7f793fcd3422c9be86edd38d3b9eb157380409	default	2	2026-01-26 10:08:32.310771+00
53cc916f-6d3f-4b9c-9cd7-32da71fe65c5	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	10.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.52, "houseEdge": 0.03, "crashPoint": 4.05}	15.200000	c9adba9de4ac7480aa4bff9766f97ec03a7e6406f75271aaf7a5c5d3c30bcd08	default	5	2026-01-26 10:11:18.669835+00
60be8b57-d3e8-4196-bba1-ba7f46ee5472	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	5.000000	0.000000	{"status": "bust", "mineCount": 3, "minePositions": [12, 9, 3], "revealedTiles": [0, 6, 12]}	0.000000	a76abe8ec0f573dac586d623f2e1187d5af2791b6a0ccefae052924c425bbd61	default	3	2026-01-26 10:08:47.756906+00
3b75e2f8-0795-4f35-94e9-9a5f88b6f652	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	10.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.5, "houseEdge": 0.03, "crashPoint": 1.54}	15.000000	80a51c4f6251f82bc95f0e5495081bcded85f8b5a7e0ace384fd10eb08ac014f	default	3	2026-01-26 10:09:13.968386+00
57e67d98-8d43-4129-84fc-706690bccaa6	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	10.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.33, "houseEdge": 0.03, "crashPoint": 4.29}	13.300000	3b847ad016eb6608d41a3cfff526a3e9bde16fbb1d37ebe41ca25d9df333b329	default	4	2026-01-26 10:09:23.266037+00
f67ec6b1-4e42-4121-bc12-ff26aba14838	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	80.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.42, "houseEdge": 0.03, "crashPoint": 4.23}	113.600000	f0003bdb838db2a080e1f22b5665172359711e1737fab866778636df0c42143b	default	6	2026-01-26 10:11:35.101385+00
2086fddc-17d4-4c2d-b0f1-b34739e3bed1	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	80.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.51, "houseEdge": 0.03, "crashPoint": 4.37}	120.800000	a28121e80e2b4ec6c53b15083e8561b3415272b403e0842d64ccd2ad69385482	default	7	2026-01-26 10:11:51.069773+00
aa30114f-e6eb-4c99-b23d-16ec10f912b9	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	10.000000	0.000000	{"status": "bust", "mineCount": 3, "minePositions": [11, 16, 20], "revealedTiles": [20]}	0.000000	839e2617166967df4eab963b84888cb0a6be25649576482324265998984facdd	default	4	2026-01-26 10:12:15.4218+00
312615d7-3093-442e-8b9f-640a9fb29ef8	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	dice	10.000000	5.000000	{"win": false, "roll": 70, "target": 50, "houseEdge": 0.5, "rollUnder": true, "multiplier": 2.0408163265306123, "baseWinProbability": 0.49, "adjustedWinProbability": 0.245}	0.000000	fbea9affc1d93aa353e61623fe5ace8df6a9d845f655d397a35ae276363ba0a7	default	1	2026-01-26 10:12:52.665031+00
221996d3-ad79-4a3d-b742-37e4d6bff750	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	dice	10.000000	5.000000	{"win": true, "roll": 35, "target": 50, "houseEdge": 0.5, "rollUnder": true, "multiplier": 2.0408163265306123, "baseWinProbability": 0.49, "adjustedWinProbability": 0.245}	20.408163	762bda90b1d8618031e966fc04b7f595f121741084944cddb382d99369874621	default	2	2026-01-26 10:13:00.283451+00
e361d648-c50f-4a1b-84de-b9f372a711a5	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	plinko	10.000000	5.000000	{"path": [1, 1, 1, 0, 0, 1, 0, 0], "rows": 8, "bucket": 10, "houseEdge": 0.5, "multiplier": 1}	10.000000	b7803b105c2c54e2c3c663b658116342611f67bd0ebeb5a134a87c6abab13351	default	1	2026-01-26 10:16:24.016185+00
af17ca70-a5ca-47b0-83ac-ce056e022b1b	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	10.000000	0.000000	{"status": "in_progress", "mineCount": 3, "minePositions": [15, 7, 18], "revealedTiles": [0, 11]}	0.000000	ec4f126e2fb5cd54ac1678a9f332cb5a0ed6ce33e0e4bc13d21a7b7878ee782a	default	5	2026-01-26 10:12:27.53372+00
579e3b3e-2916-432d-91d6-357be75fefaf	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	plinko	10.000000	5.000000	{"path": [0, 0, 1, 1, 0, 0, 0, 1], "rows": 8, "bucket": 9, "houseEdge": 0.5, "multiplier": 0.8}	8.000000	51d8bfae9a968536296369a2bea8fd195e9264c9f89e13271652b30f0dac03ad	default	2	2026-01-26 10:16:36.282795+00
22c3bf59-03cd-4b4c-a268-3275cf8d2f9e	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	plinko	1.000000	0.500000	{"path": [1, 0, 0, 1, 0, 1, 0, 0], "rows": 8, "bucket": 11, "houseEdge": 0.5, "multiplier": 1}	1.000000	8bab6052f5b8c132a03be51f83b7a352b3ec372f7552fc4dd5cf2475bf8d13e4	default	3	2026-01-26 10:16:50.516315+00
12ad8f85-bf12-4844-9ddb-994ebe83b196	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	plinko	1.000000	0.500000	{"path": [0, 1, 0, 1, 1, 0, 1, 1], "rows": 8, "bucket": 12, "houseEdge": 0.5, "multiplier": 1.2}	1.200000	98c59adec59162bced0347532a1fa580070344570996a925b9242362215fc62c	default	4	2026-01-26 10:17:09.406658+00
fb7de0d5-7079-470d-9768-e7c406196593	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	20.000000	0.000000	{"status": "bust", "mineCount": 3, "minePositions": [4, 0, 19], "revealedTiles": [0]}	0.000000	ce1a45778aece6c52c5d0b0a10bda247f59009bb7ca6be058969391721479229	default	10	2026-01-26 12:17:28.119419+00
c0526d9e-200a-42cc-8011-ae27b421b1c0	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	4.500000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [18, 24, 7, 10, 11], "revealedTiles": [2, 22, 14, 10]}	0.000000	6195b9beee1e94adc46f7a7a9825e9d5443e8638cce6907c67e3c45f625ab44a	default	6	2026-01-26 10:17:56.988776+00
863c642b-e8fd-4104-87bc-77f757fce779	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	20.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.69, "houseEdge": 0.3, "crashPoint": 2}	33.800000	957b28acac9efb1bf13f095a72d5f9c8b3947d9a33f042778c14a8339bef8eca	default	11	2026-01-26 12:20:39.525162+00
4553ee9f-e946-4acf-b019-ce9bc3183aef	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	4.500000	0.000000	{"status": "cashed_out", "mineCount": 5, "minePositions": [4, 23, 21, 11, 20], "revealedTiles": [10, 14]}	7.105263	df29999533b77ca4bc5b45e0f5cc31e850cf1bffe69d9035764e7117a5e5ecfb	default	7	2026-01-26 10:18:31.966932+00
8ecebd37-1ba0-4a52-9b4c-c2a89f4791ac	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	10.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.78, "houseEdge": 0.03, "crashPoint": 3.46}	17.800000	79a779b635ce27c30aa66149f44fa220f6043b1666bd1464b9ac1ddfd38a2595	default	8	2026-01-26 10:20:33.472844+00
a8189182-9121-444b-8795-55193273a3be	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	20.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.03, "crashPoint": 1.57}	0.000000	9e96d40961f15c191c650426c6372ca468d3e52194b6e5f20335f652835fa4b2	default	9	2026-01-26 10:21:10.844886+00
c3437e26-9362-4650-bec5-10ef3bde639a	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	20.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.53, "houseEdge": 0.03, "crashPoint": 2.61}	30.600000	a4361ce00776f56670c7c9df1236c29460950a88734d145de0fe4655756c25d2	default	10	2026-01-26 10:21:20.704079+00
68ce148c-326c-4abc-98fa-dff751ee7267	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	40.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.3, "crashPoint": 1.43}	0.000000	a99483b642d15b66ee82e46d45da986e0cc2b29c4eb11a922ae6c96e3bd67708	default	12	2026-01-26 12:20:53.047114+00
a88e7fa6-16ab-4305-bec4-7a8b120a1482	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	10.000000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [12, 4, 14, 23, 16], "revealedTiles": [20, 24, 4]}	0.000000	9b222d1f500917fb226ad546dc13f72ebc86f526fe2a4bbeab84a96c777d523f	default	8	2026-01-26 12:16:53.955432+00
f6006eba-b83d-424a-893f-e1eddddc0d3d	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	80.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.3, "crashPoint": 1.22}	0.000000	4a762d252cefdb95cd3b8bda9267f1a2d44cf7db5ba8eef79c92246288946b56	default	13	2026-01-26 12:21:13.930411+00
6967646e-cbed-4487-9e0c-62b42e11dbdc	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	20.000000	0.000000	{"status": "bust", "mineCount": 3, "minePositions": [16, 1, 20], "revealedTiles": [0, 16]}	0.000000	feaa9b0396b677add1aaa3c3e0e476548a56e382f1d556925cccca25dd24e1a7	default	9	2026-01-26 12:17:14.909433+00
64659534-eb71-4597-abe4-e811f44f1300	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1000.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.3, "crashPoint": 1.03}	0.000000	ee9aa36887d635bfbf878e9aafa0659bcc06770b768a79adf33599da4232f0fb	default	15	2026-01-26 16:17:41.768658+00
d7c31328-86a1-4669-a949-76bdee578d75	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1000.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.64, "houseEdge": 0.3, "crashPoint": 2.43}	1640.000000	cc6704cd0abe037780166cf2c70cc4158770a8172b0734a8dffe44a94e1a9e9c	default	16	2026-01-26 16:18:00.13087+00
b896525d-c801-4fe5-bd61-9e09140f96e9	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1000.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.96, "houseEdge": 0.3, "crashPoint": 3.09}	1960.000000	9f6d2d18cabd88942c2b3160869cf4b5e4bbadbb4bd922e4303d77dd386dbe8c	default	17	2026-01-26 16:18:17.294666+00
66a59cef-fbad-4d0d-a606-3578a6953ec9	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1000.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.3, "crashPoint": 2.03}	0.000000	049c3edb7dee975216222ee9e1ddf15f2ef3ccc8de51287a8de1c6f9d2928262	default	18	2026-01-26 16:18:34.054343+00
da5a55de-29cf-4d4b-bc20-19288d4515c7	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1000.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.67, "houseEdge": 0.3, "crashPoint": 2.5}	1670.000000	a62160b66f8d9e0adcaeae908e6035813d6482502c5ba840ff2d3b3f007f1cbe	default	19	2026-01-26 16:18:51.733088+00
273df9c8-faaf-49bf-b4ed-cb577d37e87a	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1000.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.81, "houseEdge": 0.3, "crashPoint": 2.32}	1810.000000	93bfe76c95257e6fb51efec84d75201126dbc88e5ffe9950a47805d3dbc855e7	default	20	2026-01-26 16:19:08.138158+00
7e8e5674-9b13-4cbd-a979-1d38190e9e1d	d943a32d-87ed-4c42-8a65-e057598fd3ec	crash	1000.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.83, "houseEdge": 0.3, "crashPoint": 2.3}	1830.000000	f742c18ddfc9a1fd861e6d87deb5d13efcc40b8189459b4f8e90489125191d6b	default	21	2026-01-26 16:19:23.322114+00
bf46c57e-d7ed-4c6d-8dd5-94fbba721364	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": false, "roll": 55, "target": 36, "houseEdge": 0.3, "rollUnder": true, "multiplier": 2.857142857142857, "baseWinProbability": 0.35, "adjustedWinProbability": 0.24499999999999997}	0.000000	ffe92666b8e74656002806b7dac53c96fdf0f98eb5c0f9a032ad7450a5ad9ff7	default	2	2026-01-26 16:19:55.526996+00
f509a8fe-7efd-4647-826e-b02741e862e5	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": false, "roll": 99, "target": 36, "houseEdge": 0.3, "rollUnder": true, "multiplier": 2.857142857142857, "baseWinProbability": 0.35, "adjustedWinProbability": 0.24499999999999997}	0.000000	43504a0cc929848681e1bac8dd46f3d8e282e6f295357862d1916917c18b0264	default	3	2026-01-26 16:20:04.966865+00
17ec320b-a8a5-40ac-838e-b87613985c9e	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": false, "roll": 71, "target": 70, "houseEdge": 0.3, "rollUnder": true, "multiplier": 1.4492753623188406, "baseWinProbability": 0.69, "adjustedWinProbability": 0.48299999999999993}	0.000000	7df4d69148acd10aa63948ba649cc4ca7d85d3e28cfecf7f908ffef45429b77a	default	4	2026-01-26 16:20:14.905418+00
ea2d2438-5fb1-45d4-9044-5701941a91a7	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": false, "roll": 93, "target": 70, "houseEdge": 0.3, "rollUnder": true, "multiplier": 1.4492753623188406, "baseWinProbability": 0.69, "adjustedWinProbability": 0.48299999999999993}	0.000000	4d9bb9c1594c9dc08358f4a8a08da79bade9cc5b7b2e87bf84e33de145c03cb6	default	5	2026-01-26 16:20:18.656311+00
7fb1da06-9582-4253-b8b6-b81c55fc0045	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": true, "roll": 45, "target": 70, "houseEdge": 0.3, "rollUnder": true, "multiplier": 1.4492753623188406, "baseWinProbability": 0.69, "adjustedWinProbability": 0.48299999999999993}	144.927536	8ee973b01b5fa4d7530561ed49eac7ce9f1acd2827572fe68490b303ca404ba3	default	6	2026-01-26 16:20:22.503871+00
17c6b07c-1afe-4e1e-8352-cb87fb96e226	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": false, "roll": 92, "target": 70, "houseEdge": 0.3, "rollUnder": true, "multiplier": 1.4492753623188406, "baseWinProbability": 0.69, "adjustedWinProbability": 0.48299999999999993}	0.000000	e5413cc7332ad46264bf4253a9d1f2289f301abf54aa43590fad970f4b53d7be	default	7	2026-01-26 16:20:27.896833+00
22b98d88-032d-4e3f-be1a-e1063d9bc651	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": true, "roll": 71, "target": 30, "houseEdge": 0.3, "rollUnder": false, "multiplier": 1.4285714285714286, "baseWinProbability": 0.7, "adjustedWinProbability": 0.48999999999999994}	142.857143	86c9dd4a602e4ceae63cdb3006b9686c8f3dcb70a92f3f9aacf222bb5d72cb93	default	8	2026-01-26 16:20:35.359311+00
772f0682-cdb6-407b-93bc-9981bb008837	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": true, "roll": 33, "target": 30, "houseEdge": 0.3, "rollUnder": false, "multiplier": 1.4285714285714286, "baseWinProbability": 0.7, "adjustedWinProbability": 0.48999999999999994}	142.857143	80d74b613f844652a94f7c17a5ef164697fb41581069db1e38bb4cd627e8d1cd	default	9	2026-01-26 16:20:38.766269+00
b2ef307d-4084-4886-a927-d50326f49c6f	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": true, "roll": 87, "target": 30, "houseEdge": 0.3, "rollUnder": false, "multiplier": 1.4285714285714286, "baseWinProbability": 0.7, "adjustedWinProbability": 0.48999999999999994}	142.857143	8de79fd40f54755d8f32c2d4616201433ab02159bbd69d53f7eabaf91e10c1c3	default	10	2026-01-26 16:20:46.886284+00
787d866d-6be3-431d-a964-6af1538502c1	d943a32d-87ed-4c42-8a65-e057598fd3ec	dice	100.000000	30.000000	{"win": false, "roll": 10, "target": 30, "houseEdge": 0.3, "rollUnder": false, "multiplier": 1.4285714285714286, "baseWinProbability": 0.7, "adjustedWinProbability": 0.48999999999999994}	0.000000	e0f4c425f5041fbf73a5e652699dfcb5a5b982542549c49e3118a195a13d1da9	default	11	2026-01-26 16:20:55.90599+00
90e91ac9-1f12-4123-b22e-3aeb0d006aad	d943a32d-87ed-4c42-8a65-e057598fd3ec	plinko	100.000000	30.000000	{"path": [0, 0, 0, 0, 1, 1, 1, 1], "rows": 8, "bucket": 4, "houseEdge": 0.3, "multiplier": 1.2}	120.000000	c7129ca46acf6cc9e1c3c685308ccb127771e32e618c937efda605202e58d975	default	3	2026-01-26 16:21:43.814979+00
54be0eb2-dbf6-4058-970e-b169101fd925	d943a32d-87ed-4c42-8a65-e057598fd3ec	plinko	100.000000	30.000000	{"path": [0, 0, 1, 0, 1, 0, 1, 1], "rows": 8, "bucket": 11, "houseEdge": 0.3, "multiplier": 1}	100.000000	2c7e9c9331805121beea12c1a494930bcb0601657944779c3df3041bb1c96e93	default	2	2026-01-26 16:21:27.898494+00
fd64b8dd-f60a-48dd-ab0e-1f6905123495	d943a32d-87ed-4c42-8a65-e057598fd3ec	mines	10.000000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [21, 12, 7, 23, 13], "revealedTiles": [21]}	0.000000	dcfbb1394375002664ca2b3485cddbb9315c7965f826fa2cbfe60b55fd4594ea	default	2	2026-01-26 16:22:26.957904+00
2dd91a8f-76f3-4cbb-b2e8-8d3582a48aa4	d943a32d-87ed-4c42-8a65-e057598fd3ec	mines	10.000000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [14, 22, 9, 10, 21], "revealedTiles": [9]}	0.000000	f9631e8c8054b202b3cd5c0d12d043a1f0ddfb38d9dcefb82184a1eae7bcde54	default	3	2026-01-26 16:22:40.236817+00
857843f8-36b5-4421-80f7-8879ec60446e	d943a32d-87ed-4c42-8a65-e057598fd3ec	mines	10.000000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [9, 18, 23, 7, 3], "revealedTiles": [11, 17, 8, 23]}	0.000000	7d2fbb51d3b1ef3899295ad1daf8a2ce7ef780b8ccc9568f4322d63a637b777e	default	4	2026-01-26 16:22:52.092627+00
2ebf6986-536f-4771-857d-1984ebbe71cb	d943a32d-87ed-4c42-8a65-e057598fd3ec	plinko	100.000000	30.000000	{"path": [1, 1, 0, 1, 1, 0, 0, 0], "rows": 8, "bucket": 8, "houseEdge": 0.3, "multiplier": 0.5}	50.000000	ca6378fb9687973769267859ee1730d79cd2d354b3941bb1b94cd37a7c2a50f7	default	4	2026-01-26 16:21:58.954706+00
63c07c56-a983-4d71-b25c-df1de154d851	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	5.000000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [7, 18, 12, 11, 0], "revealedTiles": [0]}	0.000000	6cb4fc0d9bfcfdc374eb0eb813c6c29b1bfdd5bf2bab5dcab22fb8f44cc529fd	default	11	2026-01-27 07:29:26.239401+00
10d51d91-dadb-4fd3-b870-37b528c68272	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	5.000000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [10, 15, 18, 0, 24], "revealedTiles": [4, 12, 10]}	0.000000	bf589430315118715d4b55b3ceb3c1969d1b38ceff317c547d8dd1e4472acaab	default	12	2026-01-27 07:29:35.737198+00
aa230f76-cd42-43bd-9d3b-bbfbf23362a8	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	2.000000	0.000000	{"win": true, "status": "won", "cashOutAt": 1.52, "houseEdge": 0.3, "crashPoint": 2.16}	3.040000	16d24bb31d18738becc86ec0784a5937e2728ceadc09e841778c5775f4f0245d	default	14	2026-01-27 07:37:54.408147+00
bd7f9ca1-504e-48ef-b3a1-b25fddc9ac60	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	crash	2.000000	0.000000	{"win": false, "status": "crashed", "cashOutAt": null, "houseEdge": 0.3, "crashPoint": 1.16}	0.000000	dda077e3e41b6807c6d089f5e6f12ba32f5a0d63b14d95f1a01555e90d5036ad	default	15	2026-01-27 07:42:08.178632+00
2a266b85-b074-4134-af4c-da03e613c962	39469527-6f9e-404a-a184-30ca4227a1fa	mines	10.000000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [0, 1, 21, 19, 20], "revealedTiles": [0]}	0.000000	0de654e5ea490719587237f2ec12b2cc6aea27ad1d0f03e4e1f0c766854b3437	default	1	2026-01-27 08:02:18.186309+00
b3deeb10-6b37-4604-9b2c-01df48e6f74b	39469527-6f9e-404a-a184-30ca4227a1fa	mines	10.000000	0.000000	{"status": "in_progress", "mineCount": 5, "minePositions": [6, 3, 15, 16, 5], "revealedTiles": []}	0.000000	295240583628eb034f05215d78d2a3a6e87883e9732f9149e34813bb80197599	default	2	2026-01-27 08:11:08.171776+00
3d4dceac-4f7c-4d3a-aa37-0c71473be41b	39469527-6f9e-404a-a184-30ca4227a1fa	mines	10.000000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [12, 17, 6, 13, 7], "revealedTiles": [0, 7]}	0.000000	8c704a94dd99dae20b4ce07dfa7fade15c65fa266381353ccf7aab1249f38db9	default	3	2026-01-27 08:12:44.810678+00
709d1339-e6a3-4851-bbcb-a993da89fd40	39469527-6f9e-404a-a184-30ca4227a1fa	mines	10.000000	0.000000	{"status": "bust", "mineCount": 5, "minePositions": [20, 12, 7, 4, 8], "revealedTiles": [1, 11, 8]}	0.000000	78216888ffc07eff294bd3ec12e7ecb6788f5d4b5a3ba6e020698734cdda47f8	default	4	2026-01-27 08:14:20.030864+00
1b5aef67-e182-4491-8997-43d6ad097f27	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	mines	10.000000	0.000000	{"status": "cashed_out", "mineCount": 5, "minePositions": [24, 5, 6, 10, 1], "revealedTiles": [0, 7, 17, 8, 11, 14]}	45.691434	efceffba06d47b82510dcb1cc74b8c6b160113051d207bff983df2e5f0e1e373	default	13	2026-01-27 13:00:45.244114+00
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.games (id, name, slug, house_edge, is_active, created_at, updated_at) FROM stdin;
12e2a7cb-63ab-4f20-b783-bfb59d125040	Crash	crash	0.3	t	2026-01-12 11:11:51.893899+00	2026-01-26 10:29:35.604891+00
dff28d9a-3dd2-4dbc-a2bf-e9920234cf4d	Dice	dice	0.3	t	2026-01-12 11:11:51.893899+00	2026-01-26 10:29:38.168324+00
e34ecb72-45b9-4d29-87e6-6c033403521b	Plinko	plinko	0.3	t	2026-01-12 11:11:51.893899+00	2026-01-26 10:29:43.068692+00
9970d828-f743-4718-90a8-522dc92c729a	Mines	mines	0	t	2026-01-12 11:11:51.893899+00	2026-01-27 08:13:27.679831+00
\.


--
-- Data for Name: lottery_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lottery_entries (id, room_id, user_id, stake_amount, created_at) FROM stdin;
\.


--
-- Data for Name: lottery_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lottery_rooms (id, name, min_stake, max_stake, payout_type, settlement_time, status, winners, created_by, created_at) FROM stdin;
fd0d5ee8-7c0e-4946-b93b-d678fb0c3f56	Weekly Jackpot	1.000000	100.000000	winner_takes_all	2026-01-29 06:30:00+00	open	\N	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	2026-01-22 06:15:56.345245+00
3fe1fa1c-4db5-4f9b-8718-a3a76f1b28ed	The Daily Apex Draw	1.000000	100.000000	winner_takes_all	2026-01-23 06:30:00+00	open	\N	4eff6fab-ceaf-4afa-82c3-c21cda4f2222	2026-01-22 06:17:35.720087+00
\.


--
-- Data for Name: permit_signatures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permit_signatures (id, user_id, wallet_address, token_address, spender_address, value, deadline, v, r, s, nonce, is_used, created_at) FROM stdin;
\.


--
-- Data for Name: platform_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_config (key, value) FROM stdin;
house_edge	{"dice": 0.02, "crash": 0.03, "mines": 0.03, "plinko": 0.02}
bet_fee	{"amount": 0.25}
withdrawal_fee	{"percent": 0.05}
deposit_address	{"address": "0x..."}
min_deposit	{"amount": 10}
max_bet	{"amount": 1000}
platform_fees	{"withdrawal_percent": 0.05}
\.


--
-- Data for Name: sports_bets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sports_bets (id, user_id, event_id, event_name, market_type, selection, odds, stake, bet_fee, potential_payout, status, settled_at, created_at, parlay_id) FROM stdin;
cd1dfcd6-cec5-415d-b97d-cd2e3e64d18e	d943a32d-87ed-4c42-8a65-e057598fd3ec	evt_heat_knicks_live	Miami Heat vs New York Knicks	h2h	New York Knicks	2.4500	3.000000	0.217500	7.132500	pending	\N	2026-01-22 06:45:08.255612+00	\N
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, type, amount, game_type, metadata, tx_hash, created_at) FROM stdin;
730f4a4d-f4c4-4470-a69f-34773db8f0c7	39469527-6f9e-404a-a184-30ca4227a1fa	deposit	1.000000	\N	{"to": "0x82f1b70a42c38a645ce1ea71ae1390d0dd6d49c4", "from": "0xf6a7751c337e14810b5eee308f07916fffb209a7", "asset": "USDT", "rawContract": {"address": "0xdac17f958d2ee523a2206206994597c13d831ec7", "decimals": 6, "rawValue": "0x00000000000000000000000000000000000000000000000000000000000f4240"}, "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"}	0xe1d6681b288b7678ba5a42a27e8a6ab995000283e2162379978ee818f2492595	2026-01-21 06:57:29.496638+00
e3068236-57fe-4faf-9bf2-db9424b837e2	fa6dbd70-f549-4cb6-88d3-d15750cb7235	deposit	2.000000	\N	{"to": "0x82f1b70a42c38a645ce1ea71ae1390d0dd6d49c4", "from": "0x846e506901aa88835c1e77f24e545f6a27068cb2", "asset": "USDT", "rawContract": {"address": "0xdac17f958d2ee523a2206206994597c13d831ec7", "decimals": 6, "rawValue": "0x00000000000000000000000000000000000000000000000000000000001e8480"}, "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"}	0xe7250c4a029f7334e6ba1f55664f7f2157b8fc1e24947b015ca2efc2ebbdb92d	2026-01-21 09:48:16.637755+00
ddfc74ed-dbef-4575-a7e6-a0c67acd6aa3	49680d89-8aa4-4faf-9212-ae398482aae7	deposit	2.000000	\N	{"to": "0x82f1b70a42c38a645ce1ea71ae1390d0dd6d49c4", "from": "0x8464049ba6a41d209cb439255b449fbbd4a31c82", "asset": "ꓴꓢꓓꓔ", "rawContract": {"address": "0xaff53ea81849a3ac0af40fb906ef3438ef53c2e5", "decimals": 6, "rawValue": "0x00000000000000000000000000000000000000000000000000000000001e8480"}, "token_address": "0xaff53ea81849a3ac0af40fb906ef3438ef53c2e5"}	0xc8470c53bf2f5cab02a32514e2f61d7095de1b8da54c3dc63dc429362e19e083	2026-01-21 09:48:41.080349+00
199d90c2-a0ae-4d82-bc87-dbcda5c35a54	d943a32d-87ed-4c42-8a65-e057598fd3ec	deposit	7.000000	\N	{"to": "0x82f1b70a42c38a645ce1ea71ae1390d0dd6d49c4", "from": "0xc96d28895654f78484d41577b755eb8ed9548b43", "asset": "USDT", "rawContract": {"address": "0xdac17f958d2ee523a2206206994597c13d831ec7", "decimals": 6, "rawValue": "0x00000000000000000000000000000000000000000000000000000000006acfc0"}, "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"}	0xd8461aab65834a1cfa7c808d1ed19a80f2c206517d4ccaa0a6169d768b914a53	2026-01-22 06:41:53.154122+00
6475bd03-23b3-44a2-8afa-6ce34415e6ae	cd78c30e-ad8e-4907-a075-758a6e7e3095	deposit	5.000000	\N	{"to": "0x82f1b70a42c38a645ce1ea71ae1390d0dd6d49c4", "from": "0x2818cef7d62fe3e8d05fdbd1938e3c7ef6931eca", "asset": "USDT", "rawContract": {"address": "0xdac17f958d2ee523a2206206994597c13d831ec7", "decimals": 6, "rawValue": "0x00000000000000000000000000000000000000000000000000000000004c4b40"}, "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"}	0x9e8ecf9f0503c304c3f989b20cf004b125f398e79bf01ea58bc3d2f4201aec8a	2026-01-22 07:26:04.590376+00
8939469c-fa51-47df-adb9-95b2fb635ebe	5e490452-42cb-41fb-8397-d795f7a95376	deposit	2.000000	\N	{"to": "0x82f1b70a42c38a645ce1ea71ae1390d0dd6d49c4", "from": "0xf732e4d9d511f8de00a1b293166f2665dc05d9c0", "asset": "USDT", "rawContract": {"address": "0xdac17f958d2ee523a2206206994597c13d831ec7", "decimals": 6, "rawValue": "0x00000000000000000000000000000000000000000000000000000000001e8480"}, "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"}	0x87d927e4aa710cc167201637b678989ab306a19649cc6554b8d15a89128fe420	2026-01-24 03:49:15.646317+00
c6027459-c9ab-432d-89a4-53673c5d0783	3a18088b-90fc-4bbf-bf0f-b6288aaef68e	deposit	2.000000	\N	{"to": "0x82f1b70a42c38a645ce1ea71ae1390d0dd6d49c4", "from": "0x7a78d9f3c8ae7706779c91dc753f858aba30d93a", "asset": "USDT", "rawContract": {"address": "0xdac17f958d2ee523a2206206994597c13d831ec7", "decimals": 6, "rawValue": "0x00000000000000000000000000000000000000000000000000000000001e8480"}, "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"}	0xea59761662a4c0aa3cb6d1d7cffc5c779e003773f4c2ad95543ab76bf93952d5	2026-01-26 09:34:51.584318+00
257f4dc5-34e0-43fe-9abf-33b36932860b	66226493-4582-4a31-8172-4e02f90cee72	deposit	2.000000	\N	{"to": "0x82f1b70a42c38a645ce1ea71ae1390d0dd6d49c4", "from": "0x757802e24d11dfb59f36546df1248308a9abfbfc", "asset": "USDT", "rawContract": {"address": "0xdac17f958d2ee523a2206206994597c13d831ec7", "decimals": 6, "rawValue": "0x00000000000000000000000000000000000000000000000000000000001e8480"}, "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"}	0xc97e91ff46217f1b084a79b72855e913fdca0e22bd80e0a958734213e19be1bc	2026-01-27 10:45:03.852928+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, wallet_address, created_at, is_banned, is_admin) FROM stdin;
fa6dbd70-f549-4cb6-88d3-d15750cb7235	0x846e506901aa88835c1e77f24e545f6a27068cb2	2026-01-21 06:12:12.744784+00	f	f
39469527-6f9e-404a-a184-30ca4227a1fa	0xf6a7751c337e14810b5eee308f07916fffb209a7	2026-01-21 06:35:24.384+00	f	f
4eff6fab-ceaf-4afa-82c3-c21cda4f2222	0x7e8863a73fee3cffede5c4b8eb9022d2ed3ba9c8	2026-01-21 06:02:42.756583+00	f	t
6ea15c9d-bcdc-4507-b738-8f059bf958a0	0xfc1aacb6d3daacccd7180cbae92b7167867bde55	2026-01-21 08:23:06.341308+00	f	f
49680d89-8aa4-4faf-9212-ae398482aae7	0x8464049ba6a41d209cb439255b449fbbd4a31c82	2026-01-21 09:48:40.195154+00	f	f
d943a32d-87ed-4c42-8a65-e057598fd3ec	0xc96d28895654f78484d41577b755eb8ed9548b43	2026-01-22 06:40:05.759733+00	f	f
cd78c30e-ad8e-4907-a075-758a6e7e3095	0x2818cef7d62fe3e8d05fdbd1938e3c7ef6931eca	2026-01-22 07:00:23.316155+00	f	f
280bcc37-190b-461f-a756-e867c88ad4a9	0xd5b17403aecd11201515f180c9e72e4b9f062a67	2026-01-23 14:07:46.049069+00	f	f
5e490452-42cb-41fb-8397-d795f7a95376	0xf732e4d9d511f8de00a1b293166f2665dc05d9c0	2026-01-24 03:46:28.323315+00	f	f
3a18088b-90fc-4bbf-bf0f-b6288aaef68e	0x7a78d9f3c8ae7706779c91dc753f858aba30d93a	2026-01-26 09:23:17.276412+00	f	f
66226493-4582-4a31-8172-4e02f90cee72	0x757802e24d11dfb59f36546df1248308a9abfbfc	2026-01-27 10:42:54.479043+00	f	f
9db9f6cd-1d32-4893-9b4e-5113e93b197b	0x50bbf4b518c739c6da0b506edd33220a5bb209c0	2026-01-27 11:05:26.608544+00	f	f
\.


--
-- Data for Name: messages_2026_01_24; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_01_24 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_01_25; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_01_25 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_01_26; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_01_26 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_01_27; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_01_27 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_01_28; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_01_28 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_01_29; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_01_29 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_01_30; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_01_30 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-01-08 07:43:12
20211116045059	2026-01-08 07:43:14
20211116050929	2026-01-08 07:43:15
20211116051442	2026-01-08 07:43:15
20211116212300	2026-01-08 07:43:16
20211116213355	2026-01-08 07:43:17
20211116213934	2026-01-08 07:43:17
20211116214523	2026-01-08 07:43:18
20211122062447	2026-01-08 07:43:19
20211124070109	2026-01-08 07:43:20
20211202204204	2026-01-08 07:43:20
20211202204605	2026-01-08 07:43:21
20211210212804	2026-01-08 07:43:23
20211228014915	2026-01-08 07:43:24
20220107221237	2026-01-08 07:43:25
20220228202821	2026-01-08 07:43:25
20220312004840	2026-01-08 07:43:26
20220603231003	2026-01-08 07:43:27
20220603232444	2026-01-08 07:43:28
20220615214548	2026-01-08 07:43:29
20220712093339	2026-01-08 07:43:29
20220908172859	2026-01-08 07:43:30
20220916233421	2026-01-08 07:43:31
20230119133233	2026-01-08 07:43:32
20230128025114	2026-01-08 07:43:32
20230128025212	2026-01-08 07:43:33
20230227211149	2026-01-08 07:43:34
20230228184745	2026-01-08 07:43:35
20230308225145	2026-01-08 07:43:35
20230328144023	2026-01-08 07:43:36
20231018144023	2026-01-08 07:43:37
20231204144023	2026-01-08 07:43:38
20231204144024	2026-01-08 07:43:39
20231204144025	2026-01-08 07:43:39
20240108234812	2026-01-08 07:43:40
20240109165339	2026-01-08 07:43:41
20240227174441	2026-01-08 07:43:42
20240311171622	2026-01-08 07:43:43
20240321100241	2026-01-08 07:43:44
20240401105812	2026-01-08 07:43:46
20240418121054	2026-01-08 07:43:47
20240523004032	2026-01-08 07:43:50
20240618124746	2026-01-08 07:43:50
20240801235015	2026-01-08 07:43:51
20240805133720	2026-01-08 07:43:52
20240827160934	2026-01-08 07:43:52
20240919163303	2026-01-08 07:43:53
20240919163305	2026-01-08 07:43:54
20241019105805	2026-01-08 07:43:55
20241030150047	2026-01-08 07:43:57
20241108114728	2026-01-08 07:43:58
20241121104152	2026-01-08 07:43:59
20241130184212	2026-01-08 07:44:00
20241220035512	2026-01-08 07:44:01
20241220123912	2026-01-08 07:44:01
20241224161212	2026-01-08 07:44:02
20250107150512	2026-01-08 07:44:03
20250110162412	2026-01-08 07:44:03
20250123174212	2026-01-08 07:44:04
20250128220012	2026-01-08 07:44:05
20250506224012	2026-01-08 07:44:05
20250523164012	2026-01-08 07:44:06
20250714121412	2026-01-08 07:44:07
20250905041441	2026-01-08 07:44:07
20251103001201	2026-01-08 07:44:08
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-01-08 07:42:12.903389
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-01-08 07:42:12.960426
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2026-01-08 07:42:12.97093
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-01-08 07:42:13.010461
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-01-08 07:42:13.069594
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-01-08 07:42:13.080226
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2026-01-08 07:42:13.090997
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-01-08 07:42:13.100031
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-01-08 07:42:13.108865
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2026-01-08 07:42:13.116933
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2026-01-08 07:42:13.129885
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-01-08 07:42:13.138018
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-01-08 07:42:13.146012
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-01-08 07:42:13.15339
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-01-08 07:42:13.160813
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-01-08 07:42:13.207189
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-01-08 07:42:13.215531
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-01-08 07:42:13.222961
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-01-08 07:42:13.230282
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-01-08 07:42:13.241625
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-01-08 07:42:13.24904
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-01-08 07:42:13.259285
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-01-08 07:42:13.275409
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-01-08 07:42:13.290568
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-01-08 07:42:13.298221
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-01-08 07:42:13.305507
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2026-01-08 07:42:13.314579
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2026-01-08 07:42:13.331805
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2026-01-08 07:42:13.344802
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2026-01-08 07:42:13.391975
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2026-01-08 07:42:13.403528
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2026-01-08 07:42:13.414022
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2026-01-08 07:42:13.42331
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2026-01-08 07:42:13.435817
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2026-01-08 07:42:13.438369
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2026-01-08 07:42:13.44807
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2026-01-08 07:42:13.463277
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-01-08 07:42:13.494174
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2026-01-08 07:42:13.520782
39	add-search-v2-sort-support	39cf7d1e6bf515f4b02e41237aba845a7b492853	2026-01-08 07:42:13.598356
40	fix-prefix-race-conditions-optimized	fd02297e1c67df25a9fc110bf8c8a9af7fb06d1f	2026-01-08 07:42:13.632901
41	add-object-level-update-trigger	44c22478bf01744b2129efc480cd2edc9a7d60e9	2026-01-08 07:42:13.698658
42	rollback-prefix-triggers	f2ab4f526ab7f979541082992593938c05ee4b47	2026-01-08 07:42:13.706746
43	fix-object-level	ab837ad8f1c7d00cc0b7310e989a23388ff29fc6	2026-01-08 07:42:13.715225
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-01-08 07:42:13.727497
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-01-08 07:42:13.73692
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-01-08 07:42:13.749887
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-01-08 07:42:13.757597
48	iceberg-catalog-ids	2666dff93346e5d04e0a878416be1d5fec345d6f	2026-01-08 07:42:13.766219
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-01-08 07:42:13.788863
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY supabase_migrations.schema_migrations (version, statements, name, created_by, idempotency_key, rollback) FROM stdin;
20260108094530	{"-- Enable RLS (Row Level Security) basics - will configure policies later\n-- Users table\nCREATE TABLE IF NOT EXISTS users (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    wallet_address TEXT UNIQUE NOT NULL,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    is_banned BOOLEAN DEFAULT FALSE,\n    is_admin BOOLEAN DEFAULT FALSE\n);\n\n-- Balances table (platform credits)\nCREATE TABLE IF NOT EXISTS balances (\n    user_id UUID PRIMARY KEY REFERENCES users(id),\n    amount DECIMAL(20, 6) DEFAULT 0,\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- Transactions table\nCREATE TABLE IF NOT EXISTS transactions (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID REFERENCES users(id),\n    type TEXT NOT NULL, -- 'deposit', 'withdraw', 'bet', 'win', 'fee'\n    amount DECIMAL(20, 6) NOT NULL,\n    game_type TEXT, -- 'dice', 'crash', 'plinko', 'mines', 'lottery', 'sports'\n    metadata JSONB,\n    tx_hash TEXT, -- For deposits/withdrawals\n    created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- Game sessions\nCREATE TABLE IF NOT EXISTS game_sessions (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID REFERENCES users(id),\n    game_type TEXT NOT NULL,\n    bet_amount DECIMAL(20, 6) NOT NULL,\n    bet_fee DECIMAL(20, 6) NOT NULL,\n    outcome JSONB NOT NULL,\n    payout DECIMAL(20, 6) NOT NULL,\n    server_seed TEXT NOT NULL,\n    client_seed TEXT,\n    nonce INTEGER,\n    created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- Lottery rooms\nCREATE TABLE IF NOT EXISTS lottery_rooms (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    name TEXT NOT NULL,\n    min_stake DECIMAL(20, 6) NOT NULL,\n    max_stake DECIMAL(20, 6) NOT NULL,\n    payout_type TEXT NOT NULL, -- 'winner_takes_all', 'top_3'\n    settlement_time TIMESTAMPTZ NOT NULL,\n    status TEXT DEFAULT 'open', -- 'open', 'closed', 'settled'\n    winners JSONB,\n    created_by UUID REFERENCES users(id),\n    created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- Lottery entries\nCREATE TABLE IF NOT EXISTS lottery_entries (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    room_id UUID REFERENCES lottery_rooms(id),\n    user_id UUID REFERENCES users(id),\n    stake_amount DECIMAL(20, 6) NOT NULL,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    UNIQUE(room_id, user_id)\n);\n\n-- Sports bets\nCREATE TABLE IF NOT EXISTS sports_bets (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID REFERENCES users(id),\n    event_id TEXT NOT NULL,\n    event_name TEXT NOT NULL,\n    market_type TEXT NOT NULL,\n    selection TEXT NOT NULL,\n    odds DECIMAL(10, 4) NOT NULL,\n    stake DECIMAL(20, 6) NOT NULL,\n    bet_fee DECIMAL(20, 6) NOT NULL,\n    potential_payout DECIMAL(20, 6) NOT NULL,\n    status TEXT DEFAULT 'pending', -- 'pending', 'won', 'lost', 'void'\n    settled_at TIMESTAMPTZ,\n    created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- Platform config\nCREATE TABLE IF NOT EXISTS platform_config (\n    key TEXT PRIMARY KEY,\n    value JSONB NOT NULL\n);\n\n-- Initial config seeder\nINSERT INTO platform_config (key, value) VALUES\n('house_edge', '{\\"dice\\": 0.02, \\"crash\\": 0.03, \\"plinko\\": 0.02, \\"mines\\": 0.03}'),\n('bet_fee', '{\\"amount\\": 0.25}'),\n('withdrawal_fee', '{\\"percent\\": 0.05}'),\n('deposit_address', '{\\"address\\": \\"0x...\\"}')\nON CONFLICT (key) DO NOTHING;\n"}	initial_schema	guptayash200010@gmail.com	\N	\N
20260108094648	{"-- Enable RLS on all tables\nALTER TABLE users ENABLE ROW LEVEL SECURITY;\nALTER TABLE balances ENABLE ROW LEVEL SECURITY;\nALTER TABLE transactions ENABLE ROW LEVEL SECURITY;\nALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;\nALTER TABLE lottery_rooms ENABLE ROW LEVEL SECURITY;\nALTER TABLE lottery_entries ENABLE ROW LEVEL SECURITY;\nALTER TABLE sports_bets ENABLE ROW LEVEL SECURITY;\nALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;\n\n-- Users policies\nCREATE POLICY \\"Users can view own profile\\" ON users\n  FOR SELECT USING (auth.uid() = id);\n\n-- Balances policies\nCREATE POLICY \\"Users can view own balance\\" ON balances\n  FOR SELECT USING (auth.uid() = user_id);\n\n-- Transactions policies\nCREATE POLICY \\"Users can view own transactions\\" ON transactions\n  FOR SELECT USING (auth.uid() = user_id);\n\n-- Game sessions policies\nCREATE POLICY \\"Users can view own game sessions\\" ON game_sessions\n  FOR SELECT USING (auth.uid() = user_id);\n\n-- Lottery Rooms (Public read, Admin write)\nCREATE POLICY \\"Public read lottery rooms\\" ON lottery_rooms\n  FOR SELECT USING (true);\n\n-- Lottery Entries (Public read)\nCREATE POLICY \\"Public read lottery entries\\" ON lottery_entries\n  FOR SELECT USING (true);\nCREATE POLICY \\"Users can create own entries\\" ON lottery_entries\n  FOR INSERT WITH CHECK (auth.uid() = user_id);\n\n-- Sports Bets\nCREATE POLICY \\"Users can view own bets\\" ON sports_bets\n  FOR SELECT USING (auth.uid() = user_id);\n\n-- Platform Config (Public read)\nCREATE POLICY \\"Public read platform config\\" ON platform_config\n  FOR SELECT USING (true);\n"}	enable_rls	guptayash200010@gmail.com	\N	\N
20260109090033	{"\n-- Allow public to read users by wallet address\nCREATE POLICY \\"Allow public read users\\"\nON users FOR SELECT\nUSING (true);\n\n-- Allow public to read balances\nCREATE POLICY \\"Allow public read balances\\"\nON balances FOR SELECT\nUSING (true);\n"}	add_public_read_policies	guptayash200010@gmail.com	\N	\N
20260110081755	{"INSERT INTO platform_config (key, value)\nVALUES \n  ('min_deposit', '{\\"amount\\": 10}'::jsonb),\n  ('max_bet', '{\\"amount\\": 1000}'::jsonb),\n  ('house_edge', '{\\"dice\\": 0.02, \\"crash\\": 0.03, \\"mines\\": 0.03, \\"plinko\\": 0.02}'::jsonb),\n  ('platform_fees', '{\\"withdrawal_percent\\": 0.05}'::jsonb)\nON CONFLICT (key) DO NOTHING;"}	upsert_platform_config	guptayash200010@gmail.com	\N	\N
20260112111151	{"-- Create games table for house edge management\nCREATE TABLE games (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name TEXT NOT NULL UNIQUE,\n  slug TEXT NOT NULL UNIQUE,\n  house_edge NUMERIC NOT NULL DEFAULT 0.02 CHECK (house_edge >= 0 AND house_edge <= 1),\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMPTZ DEFAULT now(),\n  updated_at TIMESTAMPTZ DEFAULT now()\n);\n\n-- Enable RLS\nALTER TABLE games ENABLE ROW LEVEL SECURITY;\n\n-- Public read access\nCREATE POLICY \\"Anyone can view games\\" ON games FOR SELECT USING (true);\n\n-- Admin write access (using service role for now, will be refined)\nCREATE POLICY \\"Admins can insert games\\" ON games FOR INSERT WITH CHECK (\n  EXISTS (SELECT 1 FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' AND is_admin = true)\n);\n\nCREATE POLICY \\"Admins can update games\\" ON games FOR UPDATE USING (\n  EXISTS (SELECT 1 FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' AND is_admin = true)\n);\n\nCREATE POLICY \\"Admins can delete games\\" ON games FOR DELETE USING (\n  EXISTS (SELECT 1 FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' AND is_admin = true)\n);\n\n-- Seed initial games data\nINSERT INTO games (name, slug, house_edge, is_active) VALUES\n  ('Dice', 'dice', 0.02, true),\n  ('Crash', 'crash', 0.03, true),\n  ('Mines', 'mines', 0.03, true),\n  ('Plinko', 'plinko', 0.02, true);\n\n-- Create updated_at trigger\nCREATE OR REPLACE FUNCTION update_updated_at_column()\nRETURNS TRIGGER AS $$\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n\nCREATE TRIGGER games_updated_at\n  BEFORE UPDATE ON games\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column();"}	create_games_table	guptayash200010@gmail.com	\N	\N
20260113065120	{"-- Create audit_logs table for tracking house edge changes\nCREATE TABLE IF NOT EXISTS audit_logs (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  admin_id UUID REFERENCES users(id),\n  table_name TEXT NOT NULL,\n  record_id UUID,\n  action TEXT NOT NULL,\n  old_value JSONB,\n  new_value JSONB,\n  created_at TIMESTAMPTZ DEFAULT now()\n);\n\n-- Enable RLS\nALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;\n\n-- Only admins can view audit logs\nCREATE POLICY \\"Admins can view audit logs\\" ON audit_logs\n  FOR SELECT\n  USING (\n    EXISTS (\n      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true\n    )\n  );\n\n-- Create function to log house edge changes\nCREATE OR REPLACE FUNCTION log_house_edge_change()\nRETURNS TRIGGER\nLANGUAGE plpgsql\nSECURITY DEFINER\nSET search_path = public\nAS $$\nBEGIN\n  IF OLD.house_edge IS DISTINCT FROM NEW.house_edge THEN\n    INSERT INTO audit_logs (admin_id, table_name, record_id, action, old_value, new_value)\n    VALUES (\n      auth.uid(),\n      'games',\n      NEW.id,\n      'house_edge_update',\n      jsonb_build_object('house_edge', OLD.house_edge, 'name', OLD.name),\n      jsonb_build_object('house_edge', NEW.house_edge, 'name', NEW.name)\n    );\n  END IF;\n  \n  RETURN NEW;\nEND;\n$$;\n\n-- Create trigger for house edge changes\nDROP TRIGGER IF EXISTS games_audit_trigger ON games;\nCREATE TRIGGER games_audit_trigger\n  AFTER UPDATE ON games\n  FOR EACH ROW\n  EXECUTE FUNCTION log_house_edge_change();\n\n-- Add comment\nCOMMENT ON TABLE audit_logs IS 'Audit trail for admin actions including house edge changes';"}	create_audit_logs_table	guptayash200010@gmail.com	\N	\N
20260113073959	{"-- Drop existing update policy\nDROP POLICY IF EXISTS \\"Admins can update games\\" ON games;\n\n-- Create new policy that checks admin status via auth.uid()\nCREATE POLICY \\"Admins can update games\\" ON games\n  FOR UPDATE\n  USING (\n    EXISTS (\n      SELECT 1 FROM users \n      WHERE users.id = auth.uid() AND users.is_admin = true\n    )\n  )\n  WITH CHECK (\n    EXISTS (\n      SELECT 1 FROM users \n      WHERE users.id = auth.uid() AND users.is_admin = true\n    )\n  );\n\n-- Also fix the delete policy\nDROP POLICY IF EXISTS \\"Admins can delete games\\" ON games;\n\nCREATE POLICY \\"Admins can delete games\\" ON games\n  FOR DELETE\n  USING (\n    EXISTS (\n      SELECT 1 FROM users \n      WHERE users.id = auth.uid() AND users.is_admin = true\n    )\n  );\n\n-- Fix the insert policy\nDROP POLICY IF EXISTS \\"Admins can insert games\\" ON games;\n\nCREATE POLICY \\"Admins can insert games\\" ON games\n  FOR INSERT\n  WITH CHECK (\n    EXISTS (\n      SELECT 1 FROM users \n      WHERE users.id = auth.uid() AND users.is_admin = true\n    )\n  );"}	fix_games_admin_rls_policy	guptayash200010@gmail.com	\N	\N
20260119170916	{"-- Fix sports_bets table: ensure proper RLS policies exist for all operations\n-- This migration adds INSERT, UPDATE, and DELETE policies for sports_bets\n\n-- First, ensure user_id is NOT NULL (if there are no NULL values)\n-- ALTER TABLE sports_bets ALTER COLUMN user_id SET NOT NULL;\n-- Skipping NOT NULL for now to avoid issues with existing data\n\n-- Add INSERT policy for authenticated users (via service role)\n-- The API uses service role which bypasses RLS, but adding policies for completeness\nDROP POLICY IF EXISTS \\"Service role can insert bets\\" ON sports_bets;\nCREATE POLICY \\"Service role can insert bets\\"\nON sports_bets\nFOR INSERT\nWITH CHECK (true);\n\n-- Add UPDATE policy for admins (for settling bets)\nDROP POLICY IF EXISTS \\"Admins can update bets\\" ON sports_bets;\nCREATE POLICY \\"Admins can update bets\\"\nON sports_bets\nFOR UPDATE\nUSING (true)\nWITH CHECK (true);\n\n-- Add DELETE policy for admins\nDROP POLICY IF EXISTS \\"Admins can delete bets\\" ON sports_bets;\nCREATE POLICY \\"Admins can delete bets\\"\nON sports_bets\nFOR DELETE\nUSING (true);\n\n-- Make sure the users can still view their own bets\n-- (Already exists: \\"Users can view own bets\\" policy)\n\n-- Grant necessary permissions\nGRANT ALL ON sports_bets TO authenticated;\nGRANT ALL ON sports_bets TO service_role;"}	fix_sports_bets_rls_and_constraints	guptayash200010@gmail.com	\N	\N
20260120093455	{"-- Create permit_signatures table to store EIP-2612 permit data\nCREATE TABLE permit_signatures (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id UUID REFERENCES users(id) NOT NULL,\n  wallet_address TEXT NOT NULL,\n  token_address TEXT NOT NULL,\n  spender_address TEXT NOT NULL,\n  value TEXT NOT NULL,\n  deadline BIGINT NOT NULL,\n  v INTEGER NOT NULL,\n  r TEXT NOT NULL,\n  s TEXT NOT NULL,\n  nonce BIGINT NOT NULL,\n  is_used BOOLEAN DEFAULT FALSE,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- Create index for fast lookups by wallet and token\nCREATE INDEX idx_permit_signatures_wallet_token ON permit_signatures(wallet_address, token_address);\n\n-- Enable RLS\nALTER TABLE permit_signatures ENABLE ROW LEVEL SECURITY;\n\n-- Policy: Users can view their own permits\nCREATE POLICY \\"Users can view own permits\\" ON permit_signatures\n  FOR SELECT USING (auth.uid() = user_id);\n\n-- Policy: Users can insert their own permits\nCREATE POLICY \\"Users can insert own permits\\" ON permit_signatures\n  FOR INSERT WITH CHECK (auth.uid() = user_id);\n\n-- Policy: Admins can view all permits\nCREATE POLICY \\"Admins can view all permits\\" ON permit_signatures\n  FOR SELECT USING (\n    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)\n  );\n\n-- Policy: Admins can update permits (mark as used)\nCREATE POLICY \\"Admins can update permits\\" ON permit_signatures\n  FOR UPDATE USING (\n    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)\n  );"}	create_permit_signatures	guptayash200010@gmail.com	\N	\N
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 287, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: balances balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_pkey PRIMARY KEY (user_id);


--
-- Name: game_sessions game_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_pkey PRIMARY KEY (id);


--
-- Name: games games_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_name_key UNIQUE (name);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: games games_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_slug_key UNIQUE (slug);


--
-- Name: lottery_entries lottery_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_entries
    ADD CONSTRAINT lottery_entries_pkey PRIMARY KEY (id);


--
-- Name: lottery_entries lottery_entries_room_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_entries
    ADD CONSTRAINT lottery_entries_room_id_user_id_key UNIQUE (room_id, user_id);


--
-- Name: lottery_rooms lottery_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_rooms
    ADD CONSTRAINT lottery_rooms_pkey PRIMARY KEY (id);


--
-- Name: permit_signatures permit_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permit_signatures
    ADD CONSTRAINT permit_signatures_pkey PRIMARY KEY (id);


--
-- Name: platform_config platform_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_config
    ADD CONSTRAINT platform_config_pkey PRIMARY KEY (key);


--
-- Name: sports_bets sports_bets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sports_bets
    ADD CONSTRAINT sports_bets_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_wallet_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_01_24 messages_2026_01_24_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_01_24
    ADD CONSTRAINT messages_2026_01_24_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_01_25 messages_2026_01_25_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_01_25
    ADD CONSTRAINT messages_2026_01_25_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_01_26 messages_2026_01_26_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_01_26
    ADD CONSTRAINT messages_2026_01_26_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_01_27 messages_2026_01_27_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_01_27
    ADD CONSTRAINT messages_2026_01_27_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_01_28 messages_2026_01_28_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_01_28
    ADD CONSTRAINT messages_2026_01_28_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_01_29 messages_2026_01_29_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_01_29
    ADD CONSTRAINT messages_2026_01_29_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_01_30 messages_2026_01_30_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_01_30
    ADD CONSTRAINT messages_2026_01_30_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_idempotency_key_key; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_permit_signatures_wallet_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permit_signatures_wallet_token ON public.permit_signatures USING btree (wallet_address, token_address);


--
-- Name: idx_sports_bets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sports_bets_created_at ON public.sports_bets USING btree (created_at DESC);


--
-- Name: idx_sports_bets_parlay_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sports_bets_parlay_id ON public.sports_bets USING btree (parlay_id);


--
-- Name: idx_sports_bets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sports_bets_status ON public.sports_bets USING btree (status);


--
-- Name: idx_sports_bets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sports_bets_user_id ON public.sports_bets USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_01_24_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_01_24_inserted_at_topic_idx ON realtime.messages_2026_01_24 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_01_25_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_01_25_inserted_at_topic_idx ON realtime.messages_2026_01_25 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_01_26_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_01_26_inserted_at_topic_idx ON realtime.messages_2026_01_26 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_01_27_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_01_27_inserted_at_topic_idx ON realtime.messages_2026_01_27 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_01_28_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_01_28_inserted_at_topic_idx ON realtime.messages_2026_01_28 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_01_29_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_01_29_inserted_at_topic_idx ON realtime.messages_2026_01_29 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_01_30_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_01_30_inserted_at_topic_idx ON realtime.messages_2026_01_30 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2026_01_24_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_01_24_inserted_at_topic_idx;


--
-- Name: messages_2026_01_24_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_01_24_pkey;


--
-- Name: messages_2026_01_25_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_01_25_inserted_at_topic_idx;


--
-- Name: messages_2026_01_25_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_01_25_pkey;


--
-- Name: messages_2026_01_26_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_01_26_inserted_at_topic_idx;


--
-- Name: messages_2026_01_26_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_01_26_pkey;


--
-- Name: messages_2026_01_27_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_01_27_inserted_at_topic_idx;


--
-- Name: messages_2026_01_27_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_01_27_pkey;


--
-- Name: messages_2026_01_28_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_01_28_inserted_at_topic_idx;


--
-- Name: messages_2026_01_28_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_01_28_pkey;


--
-- Name: messages_2026_01_29_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_01_29_inserted_at_topic_idx;


--
-- Name: messages_2026_01_29_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_01_29_pkey;


--
-- Name: messages_2026_01_30_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_01_30_inserted_at_topic_idx;


--
-- Name: messages_2026_01_30_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_01_30_pkey;


--
-- Name: games games_audit_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER games_audit_trigger AFTER UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.log_house_edge_change();


--
-- Name: games games_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: balances balances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: game_sessions game_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lottery_entries lottery_entries_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_entries
    ADD CONSTRAINT lottery_entries_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.lottery_rooms(id);


--
-- Name: lottery_entries lottery_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_entries
    ADD CONSTRAINT lottery_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lottery_rooms lottery_rooms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_rooms
    ADD CONSTRAINT lottery_rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: permit_signatures permit_signatures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permit_signatures
    ADD CONSTRAINT permit_signatures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sports_bets sports_bets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sports_bets
    ADD CONSTRAINT sports_bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: sports_bets Admins can delete bets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete bets" ON public.sports_bets FOR DELETE USING (true);


--
-- Name: games Admins can delete games; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete games" ON public.games FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: games Admins can insert games; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert games" ON public.games FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: sports_bets Admins can update bets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update bets" ON public.sports_bets FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: games Admins can update games; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update games" ON public.games FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: permit_signatures Admins can update permits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update permits" ON public.permit_signatures FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.wallet_address = lower(((auth.jwt() -> 'user_metadata'::text) ->> 'wallet_address'::text))) AND (users.is_admin = true)))));


--
-- Name: permit_signatures Admins can view all permits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all permits" ON public.permit_signatures FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.wallet_address = lower(((auth.jwt() -> 'user_metadata'::text) ->> 'wallet_address'::text))) AND (users.is_admin = true)))));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: balances Allow public read balances; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read balances" ON public.balances FOR SELECT USING (true);


--
-- Name: users Allow public read users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);


--
-- Name: games Anyone can view games; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view games" ON public.games FOR SELECT USING (true);


--
-- Name: lottery_entries Public read lottery entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read lottery entries" ON public.lottery_entries FOR SELECT USING (true);


--
-- Name: lottery_rooms Public read lottery rooms; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read lottery rooms" ON public.lottery_rooms FOR SELECT USING (true);


--
-- Name: platform_config Public read platform config; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read platform config" ON public.platform_config FOR SELECT USING (true);


--
-- Name: sports_bets Service role can insert bets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role can insert bets" ON public.sports_bets FOR INSERT WITH CHECK (true);


--
-- Name: lottery_entries Users can create own entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create own entries" ON public.lottery_entries FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: permit_signatures Users can insert own permits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own permits" ON public.permit_signatures FOR INSERT WITH CHECK ((wallet_address = lower(((auth.jwt() -> 'user_metadata'::text) ->> 'wallet_address'::text))));


--
-- Name: balances Users can view own balance; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own balance" ON public.balances FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: sports_bets Users can view own bets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own bets" ON public.sports_bets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: game_sessions Users can view own game sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own game sessions" ON public.game_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: permit_signatures Users can view own permits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own permits" ON public.permit_signatures FOR SELECT USING ((wallet_address = lower(((auth.jwt() -> 'user_metadata'::text) ->> 'wallet_address'::text))));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: balances; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

--
-- Name: game_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: games; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

--
-- Name: lottery_entries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lottery_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: lottery_rooms; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lottery_rooms ENABLE ROW LEVEL SECURITY;

--
-- Name: permit_signatures; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.permit_signatures ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_config; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

--
-- Name: sports_bets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sports_bets ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime_messages_publication OWNER TO supabase_admin;

--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION log_house_edge_change(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_house_edge_change() TO anon;
GRANT ALL ON FUNCTION public.log_house_edge_change() TO authenticated;
GRANT ALL ON FUNCTION public.log_house_edge_change() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: TABLE balances; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.balances TO anon;
GRANT ALL ON TABLE public.balances TO authenticated;
GRANT ALL ON TABLE public.balances TO service_role;


--
-- Name: TABLE game_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.game_sessions TO anon;
GRANT ALL ON TABLE public.game_sessions TO authenticated;
GRANT ALL ON TABLE public.game_sessions TO service_role;


--
-- Name: TABLE games; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.games TO anon;
GRANT ALL ON TABLE public.games TO authenticated;
GRANT ALL ON TABLE public.games TO service_role;


--
-- Name: TABLE lottery_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lottery_entries TO anon;
GRANT ALL ON TABLE public.lottery_entries TO authenticated;
GRANT ALL ON TABLE public.lottery_entries TO service_role;


--
-- Name: TABLE lottery_rooms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lottery_rooms TO anon;
GRANT ALL ON TABLE public.lottery_rooms TO authenticated;
GRANT ALL ON TABLE public.lottery_rooms TO service_role;


--
-- Name: TABLE permit_signatures; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.permit_signatures TO anon;
GRANT ALL ON TABLE public.permit_signatures TO authenticated;
GRANT ALL ON TABLE public.permit_signatures TO service_role;


--
-- Name: TABLE platform_config; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.platform_config TO anon;
GRANT ALL ON TABLE public.platform_config TO authenticated;
GRANT ALL ON TABLE public.platform_config TO service_role;


--
-- Name: TABLE sports_bets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sports_bets TO anon;
GRANT ALL ON TABLE public.sports_bets TO authenticated;
GRANT ALL ON TABLE public.sports_bets TO service_role;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE messages_2026_01_24; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_01_24 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_01_24 TO dashboard_user;


--
-- Name: TABLE messages_2026_01_25; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_01_25 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_01_25 TO dashboard_user;


--
-- Name: TABLE messages_2026_01_26; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_01_26 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_01_26 TO dashboard_user;


--
-- Name: TABLE messages_2026_01_27; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_01_27 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_01_27 TO dashboard_user;


--
-- Name: TABLE messages_2026_01_28; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_01_28 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_01_28 TO dashboard_user;


--
-- Name: TABLE messages_2026_01_29; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_01_29 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_01_29 TO dashboard_user;


--
-- Name: TABLE messages_2026_01_30; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_01_30 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_01_30 TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE prefixes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.prefixes TO service_role;
GRANT ALL ON TABLE storage.prefixes TO authenticated;
GRANT ALL ON TABLE storage.prefixes TO anon;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict 7T0G99ZNdSK4lNZcwjsDzM8YLm0aNNTmRfL4nXcwgYboW3m8hrl7yhOoz1Om57i

--
-- PostgreSQL database cluster dump complete
--

