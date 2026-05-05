---
name: enable-apm
description: AI-powered APM mapping engine that auto-generates field-level API mappings between Commerce Hub, APM providers, and sibling platforms (Ucom, SnapPay)
---

# /enable-apm -- APM Mapping Engine for Commerce Hub

## Trigger

Activate this skill when the user runs `/enable-apm` or asks to enable, add, integrate, or map an alternative payment method to Commerce Hub.

## Command Syntax

```
/enable-apm <apm-name> --capabilities <comma-separated> [--platform <comma-separated>] [--regions <comma-separated>] [--channel web|in-app]
```

**Capabilities** (comma-separated, at least one required):
auth, capture, partial-refund, refund, cancel, void, incremental-auth, split-shipment

**Platform** (comma-separated, optional -- defaults to all known platforms):
ucom       — Generate Ucom adapter spec (Ucom → Commerce Hub → APM)
snappay    — Generate SnapPay adapter spec (SnapPay → Commerce Hub → APM)
(omitted)  — Generate adapter specs for ALL known platforms (default, backward compatible)

Multiple platforms: --platform ucom,snappay (equivalent to omitting the flag)
Case-insensitive: "Ucom", "UCOM", "ucom" all accepted.

Note: Commerce Hub ↔ APM mapping (Layer 1) is ALWAYS generated regardless of --platform value.

**Regions** (comma-separated, optional -- defaults to US):
US, CA, MX, UK, DE, FR, NL, BE, AT, CH, ES, IT, PT, SE, NO, DK, FI, PL, AU, NZ, SG, MY, TH, PH, IN, JP, KR, HK, BR, CL, CO, PE, AR

**Channel** (optional -- defaults to web):
web, in-app

### Examples

```
/enable-apm klarna --capabilities auth,capture,partial-refund,cancel --regions US,DE,SE
/enable-apm cashapp --capabilities auth,capture,refund --channel in-app
/enable-apm afterpay --capabilities auth,capture,refund,void --regions US,AU
/enable-apm ideal --capabilities auth --regions NL,BE,DE
/enable-apm klarna --capabilities auth,capture --platform ucom --regions US,DE
/enable-apm cashapp --capabilities auth,capture,refund --platform snappay
/enable-apm afterpay --capabilities auth,capture,refund,void --platform ucom,snappay --regions US,AU
```

---

## Step 0 -- Parse and Validate Input

1. Extract `<apm-name>` from the command. Normalize to lowercase (e.g., "Klarna" becomes "klarna", "CashApp" becomes "cashapp").
2. Extract `--capabilities` list. Validate each against the allowed set. Reject unknown capabilities with a clear error message.
3. Extract `--regions` list if provided. Default to `["US"]` if omitted.
4. Extract `--channel` if provided. Default to `"web"` if omitted.
5. Extract `--platform` if provided. Normalize to lowercase. Parse as comma-separated list. Validate each value against known platforms: `ucom`, `snappay`. If omitted, default to ALL known platforms: `["ucom", "snappay"]`. If any value is not in the known set, display error: "Invalid platform '{value}'. Known platforms: ucom, snappay" and halt execution.
6. Confirm the parsed input back to the user before proceeding:
   - APM name
   - Pattern (from Step 1)
   - Capabilities requested
   - Platform(s) targeted (list which adapters will be generated)
   - Regions
   - Channel

---

## Step 1 -- Pattern Identification

Classify the requested APM into exactly one of the five patterns below. The pattern determines required fields, flow shape, and template selection.

| Pattern | APMs | Key Characteristics |
|---|---|---|
| **Redirect-based Wallet** | CashApp, PayPal, Venmo, Google Pay (web) | Customer redirected to provider; grant/token flow; simple amount; `returnUrls` required |
| **Server-to-Server BNPL** | Klarna, Afterpay, Affirm, Sezzle, Zip | Session created server-side; line items REQUIRED; installment plan data; Tier 2 fields promoted to Tier 1 |
| **QR/Code-based** | Alipay, WeChat Pay | QR code or one-time code generated for scan; polling or webhook for confirmation |
| **Bank Redirect** | iDEAL, Trustly, Bancontact, BLIK | Bank selection then redirect to bank; immediate confirmation; `bankId` field |
| **Voucher/Cash** | OXXO, Boleto, Pix, Konbini | Reference code for offline payment; expiration date; async confirmation |

If the APM name does not match a known provider, ask the user to specify which pattern it follows and provide the provider's API documentation.

---

## Step 2 -- Knowledge Loading

Load the following reference files. If a file does not exist, note it as missing and proceed with the pattern template only, flagging the output as "unverified against provider schema."

```
references/commerce-hub-orders-schema.json       -- Complete CH Orders API schema (v1.26.0302) -- ALWAYS loaded
references/ucom-payment-schema.json              -- Ucom Payment Services schema (v0.2.3) -- loaded when "ucom" in --platform list
references/snappay-schema.json                   -- SnapPay API schema (v3.0.9) -- loaded when "snappay" in --platform list
references/golden-mappings/{apm-name}.json        -- Human-verified reference mapping (if available)
references/apm-providers/{apm-name}.json          -- APM provider API knowledge
references/pattern-templates/{pattern-name}.json  -- Pattern template with required fields and flow
```

Load platform schemas based on --platform list:
- If "ucom" is in the platform list: Load references/ucom-payment-schema.json
- If "snappay" is in the platform list: Load references/snappay-schema.json
- If --platform is omitted (default): Load all platform schemas

When a golden mapping exists, use it as the authoritative source. When it does not exist, generate the mapping from the pattern template and provider knowledge, and mark every field with `"confidence": "generated"` instead of `"confidence": "verified"`.

---

## Step 3 -- Layer 1: APM Connector Mapping (CH to APM Provider)

For each requested capability, generate a field-level mapping between Commerce Hub Orders API (`POST /checkouts/v1/orders` v1.26.0302) and the APM provider's API.

### 3a. Mapping Table Format

For each capability (auth, capture, partial-refund, refund, cancel, void, incremental-auth, split-shipment), produce a mapping table with these columns:

| CH Field Path | CH Type | APM Field Path | APM Type | Transform | Tier | Direction | Notes |
|---|---|---|---|---|---|---|---|
| `amount.total` | integer (minor units) | `order_amount` | integer (cents) | NONE | 1 | request | Amount in minor currency units |
| `amount.currency` | string (ISO 4217) | `purchase_currency` | string (ISO 4217) | PASSTHROUGH | 1 | request | Must not be modified |

**Direction** values: `request` (CH to APM), `response` (APM to CH), `both`.

**Transform** values:
- `NONE` -- direct copy, no transformation
- `PASSTHROUGH` -- explicitly preserved without modification (use for currency, IDs)
- `MULTIPLY_100` -- convert major units to minor units (dollars to cents)
- `DIVIDE_100` -- convert minor units to major units (cents to dollars)
- `MAP_ENUM` -- enumeration value mapping (document the mapping table in Notes)
- `FORMAT_DATE` -- date format conversion (document source and target formats in Notes)
- `CONCAT` -- concatenate multiple source fields
- `SPLIT` -- split single source field into multiple targets
- `LOOKUP` -- value lookup from configuration (e.g., merchantId to provider merchantId)
- `CUSTOM` -- custom logic required (document in Notes)

### 3b. Mapping Accuracy Tiers

ALL mapped fields have ZERO TOLERANCE on accuracy. Tiers distinguish coverage obligation:

**Tier 1 -- Must Map (every mapping, every capability):**
- `amount.total`
- `amount.currency`
- `transactionProcessingDetails.transactionId`
- `transactionDetails.operationType`
- `gatewayResponse.transactionState` (response)
- `merchantDetails.merchantId`
- `merchantDetails.storeId`
- `checkoutInteractions.returnUrls` (redirect patterns)
- `customer.email`
- `checkoutInteractions.channel`

**Tier 2 -- Map if Available:**
- `customer.name`, `customer.phone`, `customer.dateOfBirth`
- `billingAddress`, `shippingAddress`
- `orderData.itemDetails[]`
- `shippingMethod`
- `dynamicDescriptors`

**BNPL Pattern Override:** For Server-to-Server BNPL APMs, the following Tier 2 fields are promoted to Tier 1:
- `orderData.itemDetails[]` (line items with SKU, description, quantity, unit price, tax)
- `shippingAddress` (full address required)
- `customer.email` (already Tier 1)
- `customer.name`
- `customer.phone`

### 3c. Capability-Specific Endpoints

Map each capability to the corresponding CH operation and APM endpoint:

| Capability | CH Operation | CH operationType | Typical APM Endpoint |
|---|---|---|---|
| auth | POST /checkouts/v1/orders | `authorize` | Create session / Create order |
| capture | POST /checkouts/v1/orders/{orderId}/capture | `capture` | Capture / Acknowledge |
| partial-refund | POST /checkouts/v1/orders/{orderId}/refund | `refund` (partial amount) | Refund (partial) |
| refund | POST /checkouts/v1/orders/{orderId}/refund | `refund` (full amount) | Refund (full) |
| cancel | POST /checkouts/v1/orders/{orderId}/cancel | `cancel` | Cancel / Void |
| void | POST /checkouts/v1/orders/{orderId}/void | `void` | Release / Expire |
| incremental-auth | POST /checkouts/v1/orders/{orderId}/incremental | `incremental-authorize` | Update order amount |
| split-shipment | POST /checkouts/v1/orders/{orderId}/capture (partial) | `capture` (partial) | Partial capture with remaining flag |

---

## Step 4 -- Safety Checks

Run ALL of the following automated checks against the Layer 1 mapping. Every check must pass. If any check fails, halt output generation, report the failure, and attempt auto-remediation. If auto-remediation fails, flag for human review.

### 4a. Amount Symmetry
- If any request mapping uses `MULTIPLY_100`, the corresponding response mapping MUST use `DIVIDE_100`.
- If no transform is applied to `amount.total` in the request, no transform may be applied in the response.
- Violation: "Amount asymmetry detected: request uses {transform} but response uses {transform}."

### 4b. Currency Preservation
- `amount.currency` must use `PASSTHROUGH` or `NONE` transform in both request and response directions.
- No mapping may modify, truncate, or reformat the ISO 4217 currency code.
- Violation: "Currency modification detected: {field_path} uses transform {transform}."

### 4c. ID Uniqueness
- `transactionProcessingDetails.transactionId` must map to exactly one target field in the APM provider.
- `transactionProcessingDetails.orderId` must map to exactly one target field.
- No CH transaction ID may fan out to multiple APM fields.
- Violation: "ID fan-out detected: {ch_field} maps to {count} APM fields: {list}."

### 4d. Tier 1 Coverage
- Every Tier 1 field must have an explicit mapping entry for every requested capability where that field is applicable.
- Missing Tier 1 field: "Tier 1 gap: {field_path} has no mapping for capability {capability}."

### 4e. Bidirectional Completeness
- Every Tier 1 field that appears in a request mapping must also have a corresponding response mapping (where applicable to the capability).
- For auth: request sends amount, response returns approvedAmount.
- For capture: request sends captureAmount, response returns capturedAmount.
- Violation: "One-way mapping: {field_path} has {direction} mapping but no {opposite_direction} mapping."

### 4f. Return URL Validation (Redirect patterns only)
- For Redirect-based Wallet and Bank Redirect patterns, `checkoutInteractions.returnUrls` must include mappings for `successUrl`, `failureUrl`, and `cancelUrl`.
- Violation: "Missing return URL: {url_type} not mapped."

### Safety Check Report Format

```markdown
## Safety Check Report -- {apm-name}

| Check | Status | Details |
|---|---|---|
| Amount Symmetry | PASS / FAIL | {details} |
| Currency Preservation | PASS / FAIL | {details} |
| ID Uniqueness | PASS / FAIL | {details} |
| Tier 1 Coverage | PASS / FAIL | {details} |
| Bidirectional Completeness | PASS / FAIL | {details} |
| Return URL Validation | PASS / FAIL / N/A | {details} |

Overall: {PASS / FAIL}
Auto-remediation applied: {yes/no}
Fields flagged for human review: {count}
```

---

## Step 5 -- Layer 2: Platform Adapter Specifications

Generate adapter specifications for each platform in the --platform list:

- If "ucom" is in the list: Generate Section 5a (Ucom adapter)
- If "snappay" is in the list: Generate Section 5b (SnapPay adapter)
- If --platform is omitted: Generate ALL sections (backward compatible)

Commerce Hub ↔ APM mapping (Layer 1, Steps 3-4) is ALWAYS generated regardless of --platform.

### 5a. Ucom Adapter (Ucom to Commerce Hub)

The Ucom adapter translates from Ucom Payment Services protocol to Commerce Hub Orders API.

**Adapter spec must include:**
1. Protocol translation: Ucom REST endpoints to CH REST endpoints (URL mapping, HTTP method mapping, header translation)
2. Field mapping: Ucom payment object fields to CH request objects (use the same table format as Layer 1)
3. Auth bridging: How Ucom auth tokens translate to CH API credentials (OAuth2 client credentials flow, token exchange pattern)
4. Response unwrapping: CH response objects back to Ucom response format
5. Error code mapping: CH gateway error codes to Ucom error codes

### 5b. SnapPay Adapter (SnapPay to Commerce Hub)

The SnapPay adapter translates from SnapPay API to Commerce Hub Orders API.

**Adapter spec must include:**
1. Domain translation: SnapPay payment domain model to CH domain model (SnapPay uses different terminology and object hierarchy)
2. Field mapping: SnapPay fields to CH request objects
3. Response translation: CH response back to SnapPay format
4. Error code mapping: CH gateway error codes to SnapPay error codes
5. **Unmappable B2B fields**: SnapPay includes B2B-specific fields that have no consumer payment equivalent in Commerce Hub. These MUST be explicitly flagged:
   - `companycode` -- no CH equivalent
   - `branchplant` -- no CH equivalent
   - `supplier{}` -- no CH equivalent
   - `clxstream[]` -- no CH equivalent
   - Document each in `unmappable-fields.md` with the field path, SnapPay type, business context, and recommended business rule

---

## Step 6 -- Output Generation

Write all output files to `output/{apm-name}/`. Create the directory if it does not exist.

### Output Files

**Always generated (Layer 1 -- Commerce Hub ↔ APM):**
```
output/{apm-name}/
  PRD.md                      -- Full PRD (adapter sections included only for selected platform(s))
  mapping-ch-to-{apm-name}.md -- Layer 1: Commerce Hub to APM field mapping (all capabilities)
  config.json                 -- Machine-readable mapping config (executable)
  test-fixtures.json          -- Sample request/response payloads for sandbox testing
  safety-check-report.md      -- Results of all automated safety checks
  unmappable-fields.md        -- Fields with no equivalent across platforms
```

**Conditionally generated (Layer 2 -- Platform adapters, based on --platform):**
```
  adapter-spec-ucom.md        -- Generated when "ucom" is in --platform list
  adapter-spec-snappay.md     -- Generated when "snappay" is in --platform list
```

**test-fixtures.json behavior:**
- Always includes: CH → APM fixtures (Layer 1)
- When "ucom" in --platform: Also includes Ucom → CH → APM chain fixtures
- When "snappay" in --platform: Also includes SnapPay → CH → APM chain fixtures
- When --platform is omitted (default): Includes all fixture variants

### Version Contract

Every generated file must include the following version contract in its header (as JSON in config.json, as a metadata block in Markdown files):

```json
{
  "versionContract": {
    "commerceHubVersion": "1.26.0302",
    "providerApiVersion": "<from provider knowledge file or 'unknown'>",
    "platforms": {
      "ucom": { "version": "0.2.3", "included": true },
      "snappay": { "version": "3.0.9", "included": false }
    },
    "generatedAt": "<ISO 8601 timestamp>",
    "patternTemplate": "<pattern-name>",
    "safetyChecksPassed": true
  }
}
```

### config.json Structure

```json
{
  "versionContract": { ... },
  "apm": "<apm-name>",
  "pattern": "<pattern-name>",
  "capabilities": ["auth", "capture", ...],
  "platform": ["ucom", "snappay"],
  "regions": ["US", "DE", ...],
  "channel": "web",
  "mappings": {
    "auth": {
      "request": [
        {
          "chFieldPath": "amount.total",
          "chType": "integer",
          "apmFieldPath": "order_amount",
          "apmType": "integer",
          "transform": "NONE",
          "tier": 1,
          "direction": "request",
          "confidence": "verified"
        }
      ],
      "response": [ ... ]
    },
    "capture": { ... }
  },
  "safetyChecks": {
    "amountSymmetry": "PASS",
    "currencyPreservation": "PASS",
    "idUniqueness": "PASS",
    "tier1Coverage": "PASS",
    "bidirectionalCompleteness": "PASS",
    "returnUrlValidation": "PASS"
  }
}
```

### test-fixtures.json Structure

For each capability, generate one sample request and one sample response with realistic test data:

```json
{
  "versionContract": { ... },
  "fixtures": {
    "auth": {
      "chRequest": { ... },
      "apmRequest": { ... },
      "apmResponse": { ... },
      "chResponse": { ... }
    },
    "capture": { ... }
  }
}
```

Use sandbox-safe test values: amount 10.00 USD, test merchant IDs, example.com return URLs.

### PRD.md Structure

Generate the PRD with the following sections:

1. **Executive Summary** -- APM name, pattern classification, requested capabilities, platform(s), regions, channel, version contract. When --platform is specified, add: "This adapter specification is generated for the {platform} team. The Commerce Hub ↔ APM mapping (Layer 1) is included for reference but is owned by the Commerce Hub APM team."
2. **Commerce Hub API Mapping** -- One subsection per capability with request and response mapping tables (ALWAYS included)
3. **Ucom Adapter Specification** -- Protocol translation, field mapping, auth bridging, error mapping. INCLUDED when "ucom" in --platform list. When OMITTED, add note: "Ucom adapter spec not generated. Re-run with --platform ucom to include."
4. **SnapPay Adapter Specification** -- Domain translation, field mapping, unmappable B2B fields, error mapping. INCLUDED when "snappay" in --platform list. When OMITTED, add note: "SnapPay adapter spec not generated. Re-run with --platform snappay to include."
5. **Transaction Lifecycle** -- State machine diagram (text-based) showing: auth -> capture -> refund/void with all intermediate states
6. **Safety Check Results** -- Full safety check report table
7. **Sandbox Testing Plan** -- Step-by-step test cases for each capability with expected request/response
8. **Unmappable Fields and Business Rules Required** -- All fields that could not be mapped, with recommended business rules or manual configuration steps

---

## Commerce Hub Orders API Reference (Key Objects)

Use this as a quick reference during mapping. The full schema is in `references/commerce-hub-orders-schema.json`.

### Request Objects (21 total, key ones listed)

- **order**: `orderId`, `intent`, `orderStatus`, `paymentMethod`
- **checkoutInteractions**: `channel` (web/in-app), `actions`, `returnUrls` (successUrl, failureUrl, cancelUrl)
- **merchantDetails**: `merchantId`, `storeId`, `processorMerchantId`
- **transactionDetails**: `captureFlag`, `operationType`, `merchantTransactionId`, `merchantOrderId`
- **transactionProcessingDetails**: `orderId`, `transactionId`, `apiTraceId`
- **amount**: `total` (integer, minor units), `currency` (ISO 4217)
- **amountComponents**: `unitPrice`, `subTotal`, `taxAmounts[]`, `shippingAmount`
- **orderData**: `itemDetails[]` (each with `itemName`, `itemDescription`, `itemSKU`, `quantity`, `unitPrice`, `totalAmount`, `taxAmount`)
- **customer**: `email`, `name`, `phone`, `dateOfBirth`
- **customerAddress**, **shippingAddress**, **billingAddress**: standard address objects
- **referenceTransactionDetails**: for linking capture/refund to original auth
- **splitShipment**: `totalCount`, `finalShipment`
- **dynamicDescriptors**: `merchantName`, `customerServiceNumber`
- **encryptionData**, **deviceFingerprint[]**

### Response Objects (6 total)

- **gatewayResponse**: `transactionType`, `transactionState` (authorized, captured, declined, voided, refunded)
- **transactionProcessingDetails**: `orderId`, `transactionId`, `apiTraceId`
- **order**: `providerOrderId`
- **paymentMethod**: reflects payment method used
- **checkoutInteractions**: redirect URLs if applicable
- **paymentReceipt**: `approvedAmount`, `processorResponseDetails` (responseCode, responseMessage, approvalCode)

---

## Two-Layer Architecture Summary

```
Layer 1 -- APM Connector (bounded complexity)
  Commerce Hub  ----field mapping + value transform + auth injection---->  APM Provider
  Commerce Hub  <---field mapping + value transform---                    APM Provider

Layer 2 -- Platform Adapters (higher complexity)
  Ucom     ----protocol translation + field mapping + auth bridging---->  Commerce Hub
  SnapPay  ----domain translation + field mapping + flag unmappable B2B--->  Commerce Hub
```

Layer 1 is the core integration. Layer 2 enables sibling platforms to use the same APM through Commerce Hub as the gateway.

---

## Error Handling

- If a required reference file is missing, generate mappings from the pattern template and mark all fields with `"confidence": "generated"`. Add a warning to the PRD header: "WARNING: Generated without provider schema verification. Review all mappings before implementation."
- If the APM name is not recognized, prompt the user to specify the pattern and provide a link to the provider's API documentation.
- If a requested capability is not supported by the APM pattern (e.g., incremental-auth for a Voucher/Cash APM), warn the user and exclude it from the mapping with a note in the PRD.
- If safety checks fail and auto-remediation cannot fix the issue, write the safety-check-report.md with FAIL status and halt further output. Ask the user to resolve the flagged issues.

---

## Completion Checklist

Before presenting the output to the user, verify:

- [ ] All requested capabilities have mapping tables (Layer 1)
- [ ] All Tier 1 fields are mapped for every capability
- [ ] BNPL Tier promotion applied if pattern is Server-to-Server BNPL
- [ ] Safety checks all PASS (or failures documented and flagged)
- [ ] Ucom adapter spec generated (Layer 2) -- SKIP if "ucom" not in --platform list
- [ ] SnapPay adapter spec generated with unmappable B2B fields flagged (Layer 2) -- SKIP if "snappay" not in --platform list
- [ ] config.json is valid JSON and parseable
- [ ] test-fixtures.json has fixtures for every requested capability
- [ ] Version contract is present in every output file
- [ ] PRD.md follows the 8-section template structure
- [ ] All files written to `output/{apm-name}/`
