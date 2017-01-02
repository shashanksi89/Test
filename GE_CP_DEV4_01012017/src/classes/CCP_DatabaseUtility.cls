public class CCP_DatabaseUtility {
    private static set<string> createSetofUCMIDs(){
        List<user> userList = new list<User>();
        string curAccntId = '';
        userList = [Select Contact.AccountId from user where id = :UserInfo.getUserId() AND ContactId != null];
        if(!userList.isEmpty()){
            curAccntId = userList[0].Contact.AccountId;
        }
        String selectstring;
        Set<string> accountUCMIds = new Set<string>();
        if(curAccntId != '' && curAccntId != null){
            selectstring= 'select Id,UCM_ID__c from Account where Full_Hierarchy_Text__c like \'%' + curAccntId + '%\'';
            for(Account a : Database.query(selectstring)){
                accountUCMIds.add(a.UCM_ID__c);
            }  
        }
        
        return accountUCMIds;
    }
    
    public static List<CCP_OrderDataWrapper> fetchMyOrders(string inputSearch, string sortType, string sortOrder, date fromDate, date toDate, string orderStatusFilter){
        set<string> userUCMIDs = createSetofUCMIDs();
        List<CCP_OrderDataWrapper> myOrders = new List<CCP_OrderDataWrapper>();
        if(userUCMIDs != null && !userUCMIDs.isEmpty()){
            string UCMIDs = '';
            for(String s: userUCMIDs)
            {
                UCMIDs += '\''+s+'\',';
            }
            UCMIDs = UCMIDs.removeEnd(',');
            string baseQuery = 'Select Id, PO_Number__c, CurrencyISOCode, Order_Number__c, Shipping_Address__c,Customer_Name__c,Facility_Name__c, Order_Date__c, Order_Status__c,Total_Order_Value__c,StatusSortCode__c,Order_Source__c, BT_Account_UCM_Ids__c, ST_Account_UCM_Ids__c, Shipping_Address_Line_1__c, Shipping_Address_Line_2__c, Shipping_Address_Line_3__c, Shipping_Address_Line_4__c, Shipping_Address_State__c, Shipping_Address_City__c, Shipping_Address_Country_Code__c, Shipping_Address_Zip__c FROM Order_Header__c';
            string whereClause = ' WHERE (ST_Account_UCM_Ids__c INCLUDES ('+UCMIDs+') OR BT_Account_UCM_Ids__c INCLUDES ('+UCMIDs+')) AND Order_Status__c != \'Entered\' AND (ST_Account_UCM_Ids__c != null OR BT_Account_UCM_Ids__c != null) AND Order_Source__c = \'eOM\'';
            if(inputSearch != null && inputSearch != ''){
                whereClause = whereClause + ' AND (Order_Number__c like \'%'+inputSearch+'%\' OR PO_Number__c like \'%'+inputSearch+'%\' OR Customer_Name__c like \'%'+inputSearch+'%\' OR Shipping_Address__c like \'%'+inputSearch+'%\')';
            }
            if(fromDate != null){
                whereClause = whereClause + ' AND Order_Date__c >= :fromDate';
            }
            if(toDate != null){
                whereClause = whereClause + ' AND Order_Date__c <= :toDate';
            }
            if(orderStatusFilter != null && orderStatusFilter != ''){
                string orderStatusString = '(';
                for(String s: orderStatusFilter.split(';'))
                {
                    orderStatusString += '\''+s+'\',';
                }
                orderStatusString = orderStatusString.removeEnd(',');
                orderStatusString = orderStatusString + ')';
                whereClause = whereClause + ' AND Order_Status__c IN ' + orderStatusString;
            }
            string querySortType = ' Order By Order_Date__c';
            string querySortOrder = ' DESC';
            if(sortType != null && sortType != ''){
                if(sortType == 'OrderValue'){
                    querySortType = ' Order By Total_Order_Value__c';
                    if(sortOrder == 'ASC'){
                        querySortOrder = ' ASC';
                    }
                }
                if(sortType == 'OrderDate'){
                    querySortType = ' Order By Order_Date__c';
                    if(sortOrder == 'ASC'){
                        querySortOrder = ' ASC';
                    }
                }
                if(sortType == 'CustName'){
                    querySortType = ' Order By Customer_Name__c';
                    if(sortOrder == 'ASC'){
                        querySortOrder = ' ASC, Order_date__c DESC';
                    }
                }
            }
            string queryString = baseQuery + whereClause + querySortType + querySortOrder;
            system.debug('query-->'+queryString);
            for(Order_Header__c orderHeader: database.query(queryString)){
                if(!(orderHeader.Order_status__c == 'Cancelled' && orderHeader.Order_Date__c == null)){
                    CCP_OrderDataWrapper orderWrap = new CCP_OrderDataWrapper();
                    orderWrap.GON = orderHeader.Order_Number__c;
                    orderWrap.PONumber = orderHeader.PO_Number__c;
                    orderWrap.CustomerName = orderHeader.Customer_Name__c;
                    orderWrap.CustomerAddress = orderHeader.Shipping_Address__c;
                    orderWrap.addressLine1 = (orderHeader.Shipping_Address_Line_1__c != null?orderHeader.Shipping_Address_Line_1__c.toUpperCase():'') + ' ' + (orderHeader.Shipping_Address_Line_2__c != null?orderHeader.Shipping_Address_Line_2__c.toUpperCase():(orderHeader.Shipping_Address_Line_3__c != null?orderHeader.Shipping_Address_Line_3__c.toUpperCase():(orderHeader.Shipping_Address_Line_4__c != null?orderHeader.Shipping_Address_Line_4__c.toUpperCase():'')));
                    orderWrap.addressLine2 = (orderHeader.Shipping_Address_City__c != null?orderHeader.Shipping_Address_City__c.toUpperCase():'')+' '+(orderHeader.Shipping_Address_State__c != null?orderHeader.Shipping_Address_State__c.toUpperCase():'');
                    orderWrap.addressLise3 = (orderHeader.Shipping_Address_Zip__c != null?orderHeader.Shipping_Address_Zip__c.toUpperCase():'') +' '+(orderHeader.Shipping_Address_Country_Code__c != null?orderHeader.Shipping_Address_Country_Code__c.toUpperCase():'');
                    datetime OID = orderHeader.Order_Date__c;
                    if(OID != null){
                        orderWrap.OrderApprovalDate = OID.format('d MMM yyyy');
                        orderWrap.OrderApprovalDate_ISO = orderHeader.Order_Date__c.date();
                    }else{
                        orderWrap.OrderApprovalDate = '';
                    }
                    orderWrap.OrderStatus = orderHeader.Order_Status__c;
                    orderWrap.TotalOrderValue = orderHeader.Total_Order_Value__c;
                    orderWrap.statusSortCode = integer.valueOf(orderHeader.StatusSortCode__c);
                    orderWrap.currencyCode = orderHeader.CurrencyIsoCode;
                    myOrders.add(orderWrap);
                }
            }
            if(sortType == 'OrderStatus'){
                map<string, List<CCP_OrderDataWrapper>> orderStatusOrderMap = new map<string, List<CCP_OrderDataWrapper>>();
                for(CCP_OrderDataWrapper orderWrap:myOrders){
                    if(orderStatusOrderMap.containsKey(orderWrap.OrderStatus)){
                        orderStatusOrderMap.get(orderWrap.OrderStatus).add(orderWrap); 
                    }else{
                        orderStatusOrderMap.put(orderWrap.OrderStatus, new List<CCP_OrderDataWrapper>{orderWrap});
                    }
                }
                myOrders.clear();
                if(sortOrder == 'ASC'){
                    if(orderStatusOrderMap.containsKey('Open'))
                        myOrders.addAll(orderStatusOrderMap.get('Open'));
                    if(orderStatusOrderMap.containsKey('Closed'))
                        myOrders.addAll(orderStatusOrderMap.get('Closed'));
                }
                if(sortOrder == 'DESC'){
                    if(orderStatusOrderMap.containsKey('Closed'))
                        myOrders.addAll(orderStatusOrderMap.get('Closed'));
                    if(orderStatusOrderMap.containsKey('Open'))
                        myOrders.addAll(orderStatusOrderMap.get('Open'));
                }
                if(orderStatusOrderMap.containsKey('Cancelled'))
                    myOrders.addAll(orderStatusOrderMap.get('Cancelled'));
            }    
        }
        
        return myOrders;
    }
    
    public static Map<string, string> fetchMyInvoices(String inputSearch, String sortType, String sortOrder, 
                                                      String fromDate, String toDate, String invoiceStatusFilter, integer offset, string GON){
                                                          
                                                          List<CCP_InvoiceDataWrapper> invoiceWrappers = new List<CCP_InvoiceDataWrapper>();
                                                          set<string> userUCMIDs = createSetofUCMIDs();
														  string UCMIDs1 = '';
														  string UCMIDs2 = '';
														  string UCMIDs3 = '';
														  string UCMIDs4 = '';
														  string UCMIDs5 = '';
														  string UCMIDs6 = '';
														  if(userUCMIDs.size() <= 1000){
															for(String s: userUCMIDs)
															  {
																  UCMIDs1 += s+';';
															  }
															  UCMIDs1 = UCMIDs1.removeEnd(';');  
														  }else{
															  map<string, string> paramUCMIdsMap = new map<string, string>();
															  list<string> ucmIdsList = new List<string>();
															  ucmIdsList.addAll(userUCMIDs);
															  integer quotient;
															  integer remainder;
															  if(ucmIdsList.size() >= 6000){
																  quotient = 6;
																  remainder = 0;
															  }else{
																 quotient = ucmIdsList.size()/1000;
																 remainder = math.mod(ucmIdsList.size(), 1000);
															  }
															  for(integer i=0; i<quotient; i++){
																  string paramName = 'UCMIDs'+string.valueOf(i+1);
																  string UCMIdsString = '';
																  for(integer j=0; j<1000; j++){
																	 UCMIdsString += ucmIdsList[(i*1000)+j]+';'; 
																  }
																  paramUCMIdsMap.put(paramName, UCMIdsString);
															  }
															  if(remainder != 0){
																  string paramName = 'UCMIDs'+string.valueOf(quotient+1);
																  string UCMIdsString = '';
																  for(integer i=quotient; i<ucmIdsList.size(); i++){
																	 UCMIdsString += ucmIdsList[i]+';'; 
																  }
																  paramUCMIdsMap.put(paramName, UCMIdsString);
															  }
                                                              system.debug('&&&'+paramUCMIdsMap.size()+'&&&'+paramUCMIdsMap.keyset());
															  if(paramUCMIdsMap.containskey('UCMIDs1')){
																  UCMIDs1 = paramUCMIdsMap.get('UCMIDs1');
															  }
															  if(paramUCMIdsMap.containskey('UCMIDs2')){
																  UCMIDs2 = paramUCMIdsMap.get('UCMIDs2');
															  }
															  if(paramUCMIdsMap.containskey('UCMIDs3')){
																  UCMIDs3 = paramUCMIdsMap.get('UCMIDs3');
															  }
															  if(paramUCMIdsMap.containskey('UCMIDs4')){
																  UCMIDs4 = paramUCMIdsMap.get('UCMIDs4');
															  }
															  if(paramUCMIdsMap.containskey('UCMIDs5')){
																  UCMIDs5 = paramUCMIdsMap.get('UCMIDs5');
															  }
															  if(paramUCMIdsMap.containskey('UCMIDs6')){
																  UCMIDs6 = paramUCMIdsMap.get('UCMIDs6');
															  }
														  }
                                                          
                                                          String token = CCP_InvoiceUtility.GetOAuth('GEHC_InvCustPortal_API'); 
                                                          if(string.isBlank(inputSearch)) 
                                                              inputSearch = '';
                                                          if(string.isBlank(sortType)){
                                                              sortType = '';                                                      
                                                          }else{
                                                              if(sortType == 'InvoiceDate')
                                                                  sortType = 'INV_DT';
                                                              if(sortType == 'InvoiceValue')
                                                                  sortType='NVL(INV_LOCAL_AMT,0)+NVL(SHIP_HANDLING_AMT,0)+NVL(TAX_AMT,0)';
                                                              if(sortType == 'InvoiceStatus')
                                                                  sortType = 'STATUS';
                                                          }
                                                          if(string.isBlank(sortOrder))
                                                              sortOrder = '';                                                           
                                                          if(string.isBlank(fromDate))
                                                              fromDate = ''; 
                                                          if(string.isBlank(toDate))
                                                              toDate = '';
                                                          system.debug('***'+invoiceStatusFilter);
                                                          if(string.isBlank(invoiceStatusFilter) || (!string.isBlank(invoiceStatusFilter) && invoiceStatusFilter.contains(';'))){
                                                              invoiceStatusFilter = '';
                                                          }else{
                                                              if(invoiceStatusFilter == 'Open')
                                                                  invoiceStatusFilter = 'OP';
                                                              else if(invoiceStatusFilter == 'Closed')
                                                                  invoiceStatusFilter = 'CL'; 
                                                          }
                                                          if(offset == null)
                                                              offset = 0;
                                                          if(string.isBlank(GON)) 
                                                              GON = '';
                                                          system.debug('token****'+token);
                                                          HttpRequest req = CCP_InvoiceUtility.getInvCustPortalInfo(token, UCMIDs1,inputSearch, sortType, sortOrder, fromDate, toDate, invoiceStatusFilter, string.valueOf(offset), GON, UCMIDs2, UCMIDs3, UCMIDs4, UCMIDs5, UCMIDs6);
                                                          system.debug('Request****'+req);
                                                          HTTPResponse res ;
                                                          Http http = new Http();
                                                          if (!Test.isRunningTest())
                                                          {
                                                              res = http.send(req);
                                                          }else{
                                                              res = new HttpResponse();
                                                              res.setHeader('Content-Type', 'application/json');
                                                              res.setBody('{"Invoice_APIResponse":{"Invoice_APIResult":{"row":[{"UCM_ID":"1-ABC","CUST_NUM":"83419","SITE_NUM":"1301709","ORDER_NUM":"11410256","PO_NUM":"270991","INV_NUM":"62508297","FSET_NUM":"NULL","CURRENCY":"USD","DUE_DT":"2016-08-19T00:00:00.000Z","INV_DT":"2016-08-19T00:00:00.000Z","STATUS":"CL","INV_CLASS":"CM","EQP_SRV_INDCTR":"SERVICE","DUE_AMT":0E-7,"SHIP_HANDLING_AMT":0E-7,"INV_LOCAL_AMT":0E-7,"TAX_AMT":-81.0400000,"AMT_PAID":0E-7,"INV_SRC_TYP":"ORDER MANAGEMENT","BT_CUST_DTL":"HEALTHONE SUPPLY CHAIN SERVICE ACCOUNTS PAYABLE 75019-4677","ST_CUST_DTL":"OU MEDICAL CENTER 8124 SW 44TH ST 73179","PARTS_ORDR":"NULL","CONTRCT_NUM":"NA","SR_NUM":"NA","INV_TYP":"GPO_EXT_DOM_CM_US_DO","SYSTEM_ID":"NA","TOTAL_REC_COUNT":"196387","PREVIOUS_LNK":"ROWS_OFFST=-1~MAX_ROWS_LIMT=120","NEXT_LNK":"ROWS_OFFST=120~MAX_ROWS_LIMT=120"}]}}}');
                                                              res.setStatusCode(200);
                                                          }
                                                          system.debug('***'+res);
                                                          Map<string, string> invMap = new map<string, string>();
                                                          integer totalCount = 0;  
                                                          map<string, object> responseMap = new map<string, object>(); 
                                                          Map<string, object> invoiceResponse = new map<string, object>(); 
                                                          Map<string, object> invoiceResult = new map<string, object>();
                                                          List<Object> rows = new List<Object>(); 
                                                          if (res.getStatusCode() == 200 && res != null && res.getBody() != null && res.getBody() != ''){
                                                              responseMap = (map<string, object>) JSON.deserializeUntyped(res.getBody());
                                                              if(responseMap != null && responseMap.containsKey('Invoice_APIResponse') && responseMap.get('Invoice_APIResponse') != null && responseMap.get('Invoice_APIResponse') != ''){
                                                                  invoiceResponse = (map<string, object>)responseMap.get('Invoice_APIResponse');
                                                                  system.debug('Result****'+invoiceResponse);
                                                                  if(invoiceResponse != null && invoiceResponse.containsKey('Invoice_APIResult') && invoiceResponse.get('Invoice_APIResult') != null && invoiceResponse.get('Invoice_APIResult') != ''){
                                                                      invoiceResult = (map<string, object>)invoiceResponse.get('Invoice_APIResult'); 
                                                                      system.debug('Result****'+invoiceResult);
                                                                      if(invoiceResult != null && invoiceResult.containskey('row') && invoiceResult.get('row') != null && invoiceResult.get('row') != ''){
                                                                          rows = (List<Object>)invoiceResult.get('row');  
                                                                          system.debug('Result****'+rows);
                                                                          for(Object invoiceObject : rows){
                                                                              map<string, object> invoiceMap = (map<string, object>) invoiceObject;
                                                                              CCP_InvoiceDataWrapper invoiceWrap = new CCP_InvoiceDataWrapper();
                                                                              if(invoiceMap.containsKey('INV_NUM')){
                                                                                  invoiceWrap.InvoiceNumber = (string)invoiceMap.get('INV_NUM');
                                                                              }
                                                                              if(invoiceMap.containsKey('INV_DT')){
                                                                                  string incomingDate = (string)invoiceMap.get('INV_DT');
                                                                                  Date ID = date.valueOf(incomingDate.substring(0, 10));
                                                                                  Datetime dt = datetime.newInstance(ID.year(), ID.month(),ID.day());
                                                                                  invoiceWrap.InvoiceDate = dt.format('d MMM yyyy');
                                                                                  invoiceWrap.InvoiceDate_ISO = ID;
                                                                              }
                                                                              if(invoiceMap.containsKey('PO_NUM')){
                                                                                  invoiceWrap.PONumber = (string)invoiceMap.get('PO_NUM');
                                                                              }
                                                                              if(invoiceMap.containsKey('ORDER_NUM')){
                                                                                  invoiceWrap.GON = (string)invoiceMap.get('ORDER_NUM');
                                                                              }
                                                                              if(invoiceMap.containsKey('INV_LOCAL_AMT')){
                                                                                  invoiceWrap.InvoiceAmount = (Decimal)invoiceMap.get('INV_LOCAL_AMT');
                                                                              }
                                                                              if(invoiceMap.containsKey('SHIP_HANDLING_AMT')){
                                                                                  invoiceWrap.InvoiceAmount += (Decimal)invoiceMap.get('SHIP_HANDLING_AMT');
                                                                              }
                                                                              if(invoiceMap.containsKey('TAX_AMT')){
                                                                                  invoiceWrap.InvoiceAmount += (Decimal)invoiceMap.get('TAX_AMT');
                                                                              }
                                                                              if(invoiceMap.containsKey('DUE_AMT')){
                                                                                  invoiceWrap.InvoiceDueAmount = (Decimal)invoiceMap.get('DUE_AMT');
                                                                              }
                                                                              if(invoiceMap.containsKey('DUE_DT')){
                                                                                  string incomingDate = (string)invoiceMap.get('DUE_DT');
                                                                                  Date ID = date.valueOf(incomingDate.substring(0, 10));
                                                                                  Datetime dt = datetime.newInstance(ID.year(), ID.month(),ID.day());
                                                                                  invoiceWrap.PaymentDueDate = dt.format('d MMM yyyy');
                                                                                  invoiceWrap.PaymentDueDate_ISO = ID;
                                                                              }
                                                                              if(invoiceMap.containsKey('STATUS')){
                                                                                  if((string)invoiceMap.get('STATUS') == 'CL')
                                                                                      invoiceWrap.InvoiceStatus = 'Closed';
                                                                                  else
                                                                                      invoiceWrap.InvoiceStatus = 'Open';
                                                                              }
                                                                              if(invoiceMap.containsKey('FSET_NUM')){
                                                                                  invoiceWrap.FSetNumber = (string)invoiceMap.get('FSET_NUM');
                                                                              }
                                                                              if(invoiceMap.containsKey('CURRENCY')){
                                                                                  invoiceWrap.currencyCode = (string)invoiceMap.get('CURRENCY');
                                                                              }
                                                                              invoiceWrappers.add(invoiceWrap);
                                                                              if(invoiceMap.containsKey('TOTAL_REC_COUNT')){
                                                                                  totalCount = integer.valueOf((string)invoiceMap.get('TOTAL_REC_COUNT'));
                                                                              } 
                                                                          }
                                                                      }
                                                                  }
                                                              }
                                                          }else{
                                                              throw new applicationException('Server Side Exception: '+res.getBody()+'. Status Code: '+res.getStatusCode());
                                                          }
                                                          system.debug('***'+invoiceWrappers.size());
                                                          invMap.put('totalRecords', string.valueOf(totalCount)); 
                                                          invMap.put('invoices', JSON.serialize(invoiceWrappers));                                                             
                                                          return invMap;
                                                      }
    
    public static List<CCP_OrderDataWrapper> fetchOrderDetails(string passedGON){
        set<string> userUCMIDs = createSetofUCMIDs();
		List<CCP_OrderDataWrapper> myOrders = new List<CCP_OrderDataWrapper>();
		if(userUCMIDs != null && !userUCMIDs.isEmpty()){
			string UCMIDs = '';
            for(String s: userUCMIDs)
            {
                UCMIDs += '\''+s+'\',';
            }
            UCMIDs = UCMIDs.removeEnd(',');
			string queryString = 'Select Id, PO_Number__c, CurrencyISOCode, Order_Number__c, Shipping_Address__c,Customer_Name__c,Facility_Name__c, Order_Date__c, Order_Status__c,Total_Order_Value__c,StatusSortCode__c,Order_Source__c, BT_Account_UCM_Ids__c, ST_Account_UCM_Ids__c, Shipping_Address_Line_1__c, Shipping_Address_Line_2__c, Shipping_Address_Line_3__c, Shipping_Address_Line_4__c, Shipping_Address_State__c, Shipping_Address_City__c, Shipping_Address_Country_Code__c, Shipping_Address_Zip__c, (Select Id,Shipment_Set_Number__c,CurrencyISOCode,Description__c,Amount__c, Ultimate_Shipping_Address__c, Shipped_Date__c, isShippingComplete__c, Delivered_Date__c, isDeliveryComplete__c, Completed_Date__c, Ultimate_Shipping_Address_Line_1__c, Ultimate_Shipping_Address_Line_2__c, Ultimate_Shipping_Address_Line_3__c, Ultimate_Shipping_Address_Line_4__c, Ultimate_Shipping_Address_State__c, Ultimate_Shipping_Address_City__c, Ultimate_Shipping_Address_Zip__c, Ultimate_Shipping_Address_Country_Code__c from Shipment_Details__r) FROM Order_Header__c where (ST_Account_UCM_Ids__c INCLUDES ('+UCMIDs+') OR BT_Account_UCM_Ids__c INCLUDES ('+UCMIDs+')) AND Order_Status__c != \'Entered\' AND (ST_Account_UCM_Ids__c != null OR BT_Account_UCM_Ids__c != null) AND Order_Source__c = \'eOM\' AND Order_Number__c = \''+passedGON+'\' limit 1';
			system.debug('***'+queryString);
			for(Order_Header__c orderHeader:database.query(queryString)){
				CCP_OrderDataWrapper orderWrap = new CCP_OrderDataWrapper();
				List<CCP_FsetDataWrapper> FsetList = new List<CCP_FsetDataWrapper>();
				orderWrap.GON = orderHeader.Order_Number__c;
				orderWrap.PONumber = orderHeader.PO_Number__c;
				orderWrap.CustomerName = orderHeader.Customer_Name__c;
				orderWrap.CustomerAddress = orderHeader.Shipping_Address__c;
                orderWrap.addressLine1 = (orderHeader.Shipping_Address_Line_1__c != null?orderHeader.Shipping_Address_Line_1__c.toUpperCase():'') + ' ' + (orderHeader.Shipping_Address_Line_2__c != null?orderHeader.Shipping_Address_Line_2__c.toUpperCase():(orderHeader.Shipping_Address_Line_3__c != null?orderHeader.Shipping_Address_Line_3__c.toUpperCase():(orderHeader.Shipping_Address_Line_4__c != null?orderHeader.Shipping_Address_Line_4__c.toUpperCase():'')));
                orderWrap.addressLine2 = (orderHeader.Shipping_Address_City__c != null?orderHeader.Shipping_Address_City__c.toUpperCase():'')+' '+(orderHeader.Shipping_Address_State__c != null?orderHeader.Shipping_Address_State__c.toUpperCase():'');
                orderWrap.addressLise3 = (orderHeader.Shipping_Address_Zip__c != null?orderHeader.Shipping_Address_Zip__c.toUpperCase():'') +' '+(orderHeader.Shipping_Address_Country_Code__c != null?orderHeader.Shipping_Address_Country_Code__c.toUpperCase():'');
				orderWrap.currencyCode = orderHeader.CurrencyISOCode;
				datetime OID = orderHeader.Order_Date__c;
				if(OID != null){
					orderWrap.OrderApprovalDate = OID.format('d MMM yyyy');
                    orderWrap.OrderApprovalDate_ISO = orderHeader.Order_Date__c.date();
				}else{
					orderWrap.OrderApprovalDate = '';
				}
				orderWrap.OrderStatus = orderHeader.Order_Status__c;
				orderWrap.TotalOrderValue = orderHeader.Total_Order_Value__c;
				orderWrap.statusSortCode = integer.valueOf(orderHeader.StatusSortCode__c);
				if(orderHeader.Shipment_details__r.size() > 0){
					for(Shipment_Detail__c fset:orderHeader.Shipment_details__r){
						CCP_FsetDataWrapper FsetWrap = new CCP_FsetDataWrapper();
						FsetWrap.ShipmentSet = string.valueOf(fset.Shipment_Set_Number__c);
						FsetWrap.Description = fset.Description__c;
						FsetWrap.Amount = fset.Amount__c;
						FsetWrap.ShippingAddress = fset.Ultimate_Shipping_Address__c;
                        FsetWrap.addressLine1 = (fset.Ultimate_Shipping_Address_Line_1__c != null?fset.Ultimate_Shipping_Address_Line_1__c.toUpperCase():'') + ' ' + (fset.Ultimate_Shipping_Address_Line_2__c != null?fset.Ultimate_Shipping_Address_Line_2__c.toUpperCase():(fset.Ultimate_Shipping_Address_Line_3__c != null?fset.Ultimate_Shipping_Address_Line_3__c.toUpperCase():(fset.Ultimate_Shipping_Address_Line_4__c != null?fset.Ultimate_Shipping_Address_Line_4__c.toUpperCase():'')));
                        FsetWrap.addressLine2 = (fset.Ultimate_Shipping_Address_City__c != null?fset.Ultimate_Shipping_Address_City__c.toUpperCase():'')+' '+(fset.Ultimate_Shipping_Address_State__c != null?fset.Ultimate_Shipping_Address_State__c.toUpperCase():'');
                        FsetWrap.addressLise3 = (fset.Ultimate_Shipping_Address_Zip__c != null?fset.Ultimate_Shipping_Address_Zip__c.toUpperCase():'') +' '+(fset.Ultimate_Shipping_Address_Country_Code__c != null?fset.Ultimate_Shipping_Address_Country_Code__c.toUpperCase():'');
						FsetWrap.InititatedDate = orderWrap.OrderApprovalDate;
						FsetWrap.currencyCode = fset.CurrencyIsoCode;
						FsetWrap.DeliveryText = '';
						FsetWrap.ShippingText = '';
						if(fset.Shipped_Date__c != null){
							Datetime st = datetime.newInstance(fset.Shipped_Date__c.year(), fset.Shipped_Date__c.month(), fset.Shipped_Date__c.day());
							FsetWrap.ShippedDate = st.format('d MMM yyyy'); 
						}else{
							FsetWrap.ShippedDate = '';
						}
						if(!fset.isShippingComplete__c){
							
							if(fset.Shipped_Date__c != null){
                                if(fset.Shipped_Date__c > system.today().addYears(2)){
                                    FsetWrap.ShippedDate = 'Not Scheduled';
                                }else if(fset.Shipped_Date__c > system.today()){
                                    FsetWrap.ShippingText = 'Estimated';
                                }else{
                                    FsetWrap.ShippingText = 'Pending';
                                }
                            }
						}
						if(fset.Delivered_Date__c != null){
							Datetime delt = datetime.newInstance(fset.Delivered_Date__c.year(), fset.Delivered_Date__c.month(), fset.Delivered_Date__c.day());
							FsetWrap.DeliveredDate = delt.format('d MMM yyyy'); 
						}else{
							FsetWrap.DeliveredDate = '';
						}
						if(!fset.isDeliveryComplete__c){
							if(fset.Delivered_Date__c != null){
                                if(fset.Delivered_Date__c > system.today().addYears(2)){
                                    FsetWrap.DeliveredDate = 'Not Scheduled';
                                }else if(fset.Delivered_Date__c >= system.today()){
                                    FsetWrap.DeliveryText = 'Estimated';
                                }else{
                                    FsetWrap.DeliveryText = 'Pending';
                                }
                            }
                            
                        }
						if(fset.Completed_Date__c != null){
							Datetime ct = datetime.newInstance(fset.Completed_Date__c.year(), fset.Completed_Date__c.month(), fset.Completed_Date__c.day());
							FsetWrap.CompletedDate = ct.format('d MMM yyyy');
						}else{
							FsetWrap.CompletedDate = '';
						}
						FsetWrap.isDeliveryComplete = fset.isDeliveryComplete__c;
						FsetWrap.isShippingComplete = fset.isShippingComplete__c;
						FsetList.add(FsetWrap);
					}
				}
				FsetList.sort();
				orderWrap.Fsets = FsetList;
				myOrders.add(orderWrap);        
			}
		}
        
        return myOrders;
    }
    
    @future
    public static void createErrorRecord(string src, string msg, string userId){
        System_Event_Log__c SysLog = new System_Event_Log__c();
        SysLog.Log_Source__c = src;
        SysLog.Message__c = msg;
        SysLog.OwnerId = userID;
        try{
           insert sysLog; 
        }catch(exception ex){
            system.debug(ex.getMessage());
        }
        
    }
        
    public class applicationException extends Exception{}
}