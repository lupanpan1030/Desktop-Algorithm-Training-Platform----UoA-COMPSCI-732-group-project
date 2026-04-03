#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/Users/ethan/Documents/GitHub/group-project-delightful-dogs"
ENV_DIR="/opt/anaconda3/envs/delightful-dogs-dev"
NODE_BIN="${ENV_DIR}/bin/node"
NPM_CLI="${ENV_DIR}/lib/node_modules/npm/bin/npm-cli.js"

if [[ ! -x "${NODE_BIN}" ]]; then
  echo "Missing ${NODE_BIN}."
  echo "Create the environment first:"
  echo "  conda env create -f environment.yml"
  exit 1
fi

if [[ ! -f "${NPM_CLI}" ]]; then
  echo "Missing ${NPM_CLI}."
  echo "Recreate the environment from environment.yml."
  exit 1
fi

cd "${REPO_ROOT}"
export PATH="${ENV_DIR}/bin:${PATH}"

exec "${NODE_BIN}" "${NPM_CLI}" start
