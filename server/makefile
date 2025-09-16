E2E_ENV = BASE_URL?=http://localhost:8080 USER_ID?=user-e2e-soroban-01 DEFY_API_TOKEN?=devtoken PSP_WEBHOOK_SECRET?=whsec_xxx

e2e-soroban:
	$(E2E_ENV) VAULT_DEFAULT_ID=$${VAULT_DEFAULT_ID} \
	./scripts/e2e/smoke_e2e_soroban.sh
