#!/usr/bin/env bash

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo "Source this script instead of executing it:"
  echo "  source scripts/use-dev-node.sh"
  exit 1
fi

REPO_ROOT="/Users/ethan/Documents/GitHub/group-project-delightful-dogs"
ENV_DIR="/opt/anaconda3/envs/delightful-dogs-dev"

if [[ ! -x "${ENV_DIR}/bin/node" ]]; then
  echo "Missing ${ENV_DIR}/bin/node."
  echo "Create the environment first:"
  echo "  conda env create -f environment.yml"
  return 1
fi

cd "${REPO_ROOT}" || return 1

case ":${PATH}:" in
  *":${ENV_DIR}/bin:"*) ;;
  *) export PATH="${ENV_DIR}/bin:${PATH}" ;;
esac

hash -r 2>/dev/null || true

echo "Using Node $(node -v) from $(which node)"
echo "Working directory: ${REPO_ROOT}"
