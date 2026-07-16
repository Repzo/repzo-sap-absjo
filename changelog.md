# Release Notes

## [unreleased]()

### Added

- [actions/create_refund] new action: sync Repzo refunds to SAP `/OutgoingPayment` for both cash (`PaymentType` 1, `CashAccount` from rep `USERCASHACCOUNT`) and cheque (`PaymentType` 2, `ChequeAccount` from rep `USERCHECKACCTCODE` + `ChequeNumber`/`ChequeDate` looked up from the `checks` collection by refund/linked-payment serial, since refunds don't store the cheque inline). When the cheque record isn't synced yet the action throws a clear error and the svix retry picks it up next attempt @mkhamis
- [commands/join] register the `refund.create` svix hook for `create_refund`, gated on the `refunds.createRefundHook` setting @mkhamis
- [commands/price_list] new `price_list_name_key` setting (`PLDID` | `PLDNAME`, default `PLDID`): when set to `PLDNAME` the Repzo price-list name uses the real SAP PLDNAME instead of `PL_<PLDID>`; falls back to `PL_<PLDID>` when unset or when a list has no PLDNAME. `integration_meta.id` stays PLDID-based so existing links are unaffected @mkhamis
- [RDT-3412/RDT-3415] Update invoice processing to send as sales order to SAP when setting enabled @maramalshen

### Changed

### Fixed

- [commands/measureunit] add `Pcs` and `Lit` as fallback base-unit codes (appended last) so products whose SAP UoM codes are not in the standard list (e.g. balkan) can resolve a base unit instead of failing with "Could not found the base_unit" / "factor: 0" @mkhamis
- [commands/product] when the default measure-unit name match fails, fall back to matching by SAP UoM id (`DEFAULTSALEUOMID` === `integration_meta.ALTUOMID`); handles tenants where `/Items` DEFAULTITEMUOM labels (e.g. "Pieces"/"Carton") differ from `/Uom` ALTUOMCODE (e.g. "Pcs"/"Ctn"). Name match stays primary so existing tenants are unaffected @mkhamis

### Removed

## [v1.0.41 (2025-09-01)](https://github.com/Repzo/repzo-sap-absjo.git)

### Added

- [util] in method: getUniqueConcatenatedValues, also add the promotions for items.buy @maramalshen
- [actions/***] add 2 keys in integration_meta: sync_to_sap_started & sync_to_sap_succeeded @maramalshen
- [commands/product] assign Foreign Name (ITEMDESCF) in SAP to local_name in Repzo @maramalshen
- [actions/payment] add the field UserId where it equals USERID of the SAP API REP @maramalshen
- [commands/price_list_disabled] new command: Disabled PriceListItems from Repzo if it is not found on SAP @maramalshen
- [commands/measureunit] create unique measure-unit for each product, by inject ITEMCODE in integration_meta.id @maramalshen
- [actions/create_invoice, actions/create_return_invoice] add new key: U_ISTDQR = ubl_qr || ubl_clearance_qr @maramalshen

### Changed

- [commands/rep] delete hard code of rep.warehouse for reps start with: [WS, RET, MT] @maramalshen
- [commands/client] decide if client is cash or credit depend on PAYMENTTERM instead of CLIENTGROUP @maramalshen
- [actions/**] update integration_meta using repzo.updateIntegrationMeta instead of using service.update method to avoid infinity looping @maramalshen
- [actions/create_invoice, actions/create_return_invoice] RefNum: advanced_serial_number ||serial_number.formatted @maramalshen

### Fixed

- [command/measureunit] if product has multi measureUnits, the base_measureunit should be PC, POUCH or CARD @maramalshen
- [command/measureunit-family] use _.xor instead or _.difference @maramalshen
- [command/price_list] fix bug in priceList-item @maramalshen
- [actions/**] don't update integration_meta.sync_to_sap_succeeded if it is already true @maramalshen
- [actions/create_invoice] include item.get_promotion in MEO_Serial & Promotion_Name @maramalshen
- fix bug in is_matched in client & product @maramalshen
- fix: update date formatting to use 'YYYYMMDD:000000' for UpdateAt field @maramalshen

### Removed

## [v1.0.0 (2022-04-18)](https://github.com/Repzo/repzo-sap-absjo.git)

### Added

- Prepare repo @maramalshen
- New Commands: [warehouse, rep, tag, tax, measureunit, measureunit-family, category, channel, paymentTerm, bank, priceList, priceListItem, product, disabled_product, client, disabled_client, adjust_inventory] @maramalshen
- New Actions: [invoice, return_invoice, proforma, payment, transfer] @maramalshen
- fix bug in sync_client @maramalshen
- add detail with the action.sync_id
- if create transfer was failed then send command: Adjust Inventory (optionals)
- [join] if repzo.joinActionsWebHook.status = failure then commandLog.setStatus should be fail @maramalshen
- update get data from repzo by using PatchAction @maramalshen

### Changed

### Fixed

### Removed

## [unreleased (date)](path)
