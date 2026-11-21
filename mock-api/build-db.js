#!/usr/bin/env node

/**
 * Builds mock-api/db.json for JSON Server from the files written by generate-data.js.
 *
 * JSON Server exposes every top-level array as a REST collection, so the
 * `{ tasks, meta }` and `{ statistics, lastUpdated }` wrappers are flattened:
 *
 *   tasks       <- tasks.json            (GET/POST/PATCH/DELETE /tasks)
 *   statistics  <- statistics.json       (GET /statistics)
 *   users       <- unique task assignees (GET /users)
 *   activity    <- empty, filled by the app when tasks change (POST /activity)
 *
 * Usage: npm run mock:generate
 */

const fs = require('fs');
const path = require('path');

/** Reads a JSON file that lives next to this script. */
function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, filename), 'utf8'));
}

/** Collects each assignee once, keeping the first occurrence. */
function uniqueUsers(tasks) {
  const byId = new Map();
  for (const task of tasks) {
    if (!byId.has(task.assignee.id)) {
      byId.set(task.assignee.id, task.assignee);
    }
  }
  return [...byId.values()];
}

const { tasks } = readJson('tasks.json');
const { statistics } = readJson('statistics.json');

const db = { tasks, statistics, users: uniqueUsers(tasks), activity: [] };

fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2), 'utf8');
console.log(`Generated: db.json (${tasks.length} tasks, ${db.users.length} users)`);
