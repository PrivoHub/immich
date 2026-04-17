import { redirect } from '@sveltejs/kit';
import { Route } from '$lib/route';
import type { LayoutLoad } from './$types';

export const load = (() => redirect(301, Route.users())) satisfies LayoutLoad;
