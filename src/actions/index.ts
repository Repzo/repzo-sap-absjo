import { Config, Action } from "../types";
import { EVENT } from "../types";

export const actions = async (event: any, options: Config) => {
  switch (event.queryStringParameters?.action) {
    default:
      throw `Route: ${event.queryStringParameters?.action} not found`;
  }
};

export const actionsList: Action[] = [];
