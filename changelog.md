# Release Notes

## [unreleased]()

### Added

- [util] in method: getUniqueConcatenatedValues, also add the promotions for items.buy @maramalshen
- [actions/***] add 2 keys in integration_meta: sync_to_sap_started & sync_to_sap_succeeded @maramalshen
- [commands/product] assign Foreign Name (ITEMDESCF) in SAP to local_name in Repzo @maramalshen
- [actions/payment] add the field UserId where it equals USERID of the SAP API REP @maramalshen
- [commands/price_list_disabled] new command: Disabled PriceListItems from Repzo if it is not found on SAP @maramalshen

### Changed

- [commands/rep] delete hard code of rep.warehouse for reps start with: [WS, RET, MT] @maramalshen
- [commands/client] decide if client is cash or credit depend on PAYMENTTERM instead of CLIENTGROUP @maramalshen
- [actions/**] update integration_meta using repzo.updateIntegrationMeta instead of using service.update method to avoid infinity looping @maramalshen

### Fixed

- [command/measureunit] if product has multi measureUnits, the base_measureunit should be PC, POUCH or CARD @maramalshen
- [command/measureunit-family] use _.xor instead or _.difference @maramalshen
- [command/price_list] fix bug in priceList-item @maramalshen
- [actions/**] don't update integration_meta.sync_to_sap_succeeded if it is already true @maramalshen
- [actions/create_invoice] include item.get_promotion in MEO_Serial & Promotion_Name @maramalshen

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
