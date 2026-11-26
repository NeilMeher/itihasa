import graph from '../../../../../../content/project-graph.json';
import type { APIRoute, GetStaticPaths } from 'astro';

export const getStaticPaths = (() => {
  const workOf = new Map(graph.nodes.map((node) => [node.id, node.work]));
  return [...new Set(workOf.values())].map((work) => ({
    params: { work },
    props: { edges: graph.edges.filter((edge) => workOf.get(edge.from) === work || workOf.get(edge.to) === work) },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => Response.json(props.edges);
