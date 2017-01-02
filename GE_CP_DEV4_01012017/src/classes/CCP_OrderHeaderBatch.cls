public class CCP_OrderHeaderBatch implements Database.Batchable<sObject>, Database.Stateful {
    public DateTime lastRunTime;
    public set<string> processedGONs;
    public integer totalOrdersPickedInBatch;
	public datetime batchStartTime;
    public CCP_OrderHeaderBatch(){
        integer noOfHours = 0;
        
		batchStartTime = system.now();
		
		if(CCP_BatchConfig__c.getInstance('OrderBatchConfig') != null){
            if(CCP_BatchConfig__c.getInstance('OrderBatchConfig').Hours__c != null){
                noOfHours = integer.valueOf(CCP_BatchConfig__c.getInstance('OrderBatchConfig').Hours__c); 
            } 
        }
        
        if(noOfHours != 0){
            noOfHours = -1*noOfHours;
            lastRunTime = system.now().addhours(noOfHours);
        }
        
        if(lastRunTime == null){
            lastRunTime = [Select LastModifiedDate from Order__c Order by LastModifiedDate Limit 1].LastModifiedDate;
        }
        processedGONs = new set<string>();
        totalOrdersPickedInBatch = 0;
    }
    
    public Database.QueryLocator start(Database.BatchableContext BC){
        System.debug('lastRunTime+++++'+lastRunTime);
        return Database.getQueryLocator([Select Id, Global_Order_Number__c from Order__c where LastModifiedDate >= :lastRunTime]);
    }
    
    public void execute(Database.BatchableContext BC, List<sObject> scope){
        set<string> GONs = new set<string>();
        totalOrdersPickedInBatch = totalOrdersPickedInBatch + scope.size();
        for(Order__c o:(List<Order__c>)scope){
            GONs.add(o.Global_Order_Number__c);
        }
        set<string> tempGONSet = new set<string>();
        List<CCP_OrderDataWrapper> fetchedOrders = new List<CCP_OrderDataWrapper>();
        fetchedOrders = fetchOrders(GONs);
        for(CCP_OrderDataWrapper orderWrap:fetchedOrders){
            tempGONSet.add(orderWrap.GON);
        }
        map<string, string> alreadyPresentOrders = new map<string, string>();
        map<string, map<decimal, string>> alreadyPresentFsets = new map<string, map<decimal, string>>();
        for(Order_Header__c orderHeader:[Select Id, Order_Number__c, (select Id, Shipment_Set_Number__c from Shipment_Details__r) from Order_Header__c where Order_Number__c IN :tempGONSet]){
            alreadyPresentOrders.put(orderHeader.Order_Number__c, orderHeader.Id);
            if(orderHeader.Shipment_Details__r != null && orderHeader.Shipment_Details__r.size() > 0){
                map<decimal, string> tempMap = new map<decimal, string>();
                for(Shipment_Detail__c Fset:orderHeader.Shipment_Details__r){
                    tempMap.put(Fset.Shipment_Set_Number__c, Fset.Id);
                }
                alreadyPresentFsets.put(orderHeader.Order_Number__c, tempMap);
            }
        }
        List<Order_Header__c> upsertOrdersList = new List<Order_Header__c>();
        for(CCP_OrderDataWrapper orderWrap:fetchedOrders){
            Order_Header__c orderHeader;
            if(alreadyPresentOrders.containsKey(orderWrap.GON)){
                orderHeader = new Order_Header__c(id=alreadyPresentOrders.get(orderWrap.GON));
            }else{
                orderHeader = new Order_Header__c();
            }
            orderHeader.BT_Account_UCM_Ids__c = orderWrap.BTAccountUCMIds;
            orderHeader.Customer_Address__c = orderWrap.CustomerAddress;
            orderHeader.Customer_City__c = orderWrap.customerCity;
            orderHeader.Customer_Country_Code__c = orderWrap.countryCode;
            orderHeader.Customer_Name__c = orderWrap.CustomerName;
            orderHeader.Customer_State__c = orderWrap.cutomerState;
            orderHeader.Customer_Zip__c = orderWrap.customerZip;
            orderHeader.Order_Date__c = orderWrap.OrderApprovalDateTime;
            orderHeader.Order_Number__c = orderWrap.GON;
            orderHeader.Order_Source__c = orderWrap.OrderSource;
            orderHeader.Order_Status__c = orderWrap.OrderStatus;
            orderHeader.PO_Number__c = orderWrap.PONumber;
            orderHeader.ST_Account_UCM_Ids__c = orderWrap.STAccountUCMIds;
            orderHeader.Total_Order_Value__c = orderWrap.TotalOrderValue;
            orderHeader.StatusSortCode__c = orderWrap.statusSortCode;
            orderHeader.Shipping_Address_City__c = orderWrap.addressCity;
            orderHeader.Shipping_Address_Line_1__c = orderWrap.addressLine1;
            orderHeader.Shipping_Address_Line_2__c = orderWrap.addressLine2;
            orderHeader.Shipping_Address_Line_3__c = orderWrap.addressLise3;
            orderHeader.Shipping_Address_Line_4__c = orderWrap.addressLine4;
            orderHeader.Shipping_Address_State__c = orderWrap.addressState;
            orderHeader.Shipping_Address_Zip__c = orderWrap.addressZip;
            orderHeader.CurrencyIsoCode = orderWrap.currencyCode;
            orderHeader.Shipping_Address_Country_Code__c = orderWrap.addressCountry;
            upsertOrdersList.add(orderHeader);
        }
        database.upsert(upsertOrdersList, false); 
        map<string, string> newOrdersMap = new map<string, string>();
        for(Order_Header__c orderHeader:upsertOrdersList){
            newOrdersMap.put(orderHeader.Order_Number__c, orderHeader.Id);
        }
        List<Shipment_Detail__c> upsertFsetList = new List<Shipment_Detail__c>();
        for(CCP_OrderDataWrapper orderWrap:fetchedOrders){
            for(CCP_FsetDataWrapper fsetWrap:orderWrap.Fsets){
                Shipment_Detail__c fset;
                if(alreadyPresentFsets.containsKey(orderWrap.GON)){
                    if(alreadyPresentFsets.get(orderWrap.GON).containsKey(decimal.valueOf(fsetWrap.ShipmentSet))){
                        fset = new Shipment_Detail__c(Id = alreadyPresentFsets.get(orderWrap.GON).get(decimal.valueOf(fsetWrap.ShipmentSet)));
                    }else{
                        fset = new Shipment_Detail__c();
                    }
                }else{
                    fset = new Shipment_Detail__c();
                }
                fset.Amount__c = fsetWrap.Amount;
                fset.Completed_Date__c = fsetWrap.completeddate_ISO;
                fset.Delivered_Date__c = fsetWrap.delivereddate_ISO;
                fset.Description__c = fsetWrap.Description;
                fset.Initiated_Date__c = fsetWrap.initiatedDate_ISO;
                fset.Order_Header__c = newOrdersMap.get(orderWrap.GON);
                fset.Shipment_Set_Number__c = decimal.valueOf(fsetWrap.ShipmentSet);
                fset.Shipped_Date__c = fsetWrap.shippeddate_ISO;
                fset.isShippingComplete__c = fsetWrap.isShippingComplete;
                fset.isDeliveryComplete__c = fsetWrap.isDeliveryComplete;
                fset.Ultimate_Shipping_Address_City__c = fsetWrap.addressCity;
                fset.Ultimate_Shipping_Address_Line_1__c = fsetWrap.addressLine1;
                fset.Ultimate_Shipping_Address_Line_2__c = fsetWrap.addressLine2;
                fset.Ultimate_Shipping_Address_Line_3__c = fsetWrap.addressLise3;
                fset.Ultimate_Shipping_Address_Line_4__c = fsetWrap.addressLine4;
                fset.Ultimate_Shipping_Address_State__c = fsetWrap.addressState;
                fset.Ultimate_Shipping_Address_Zip__c = fsetWrap.addressZip;
                fset.Ultimate_Shipping_Account_Name__c = fsetWrap.CustomerName;
                fset.CurrencyIsoCode = fsetWrap.currencyCode;
                fset.Ultimate_Shipping_Address_Country_Code__c = fsetWrap.addressCountry;
                upsertFsetList.add(fset);
            }
        }
        database.upsert(upsertFsetList, false);
        processedGONs.addAll(newOrdersMap.keySet());
    }
    
    public void finish(Database.BatchableContext BC){
        List<string> emailAddresses = new List<string>();
        if(CCP_BatchConfig__c.getInstance('OrderBatchConfig') != null){
            if(CCP_BatchConfig__c.getInstance('OrderBatchConfig').Email__c != null){
                emailAddresses.add(CCP_BatchConfig__c.getInstance('OrderBatchConfig').Email__c);
            }
        }
        if(!emailAddresses.isEmpty()){
            string emailHtmlBody = '<p>'+
                'Hi'+
                '</p>'+
                '<p>'+
                'The Order Aggregation batch for '+string.valueOf(system.today())+'(GMT) ran successfully and has completed on '+string.valueOf(system.now())+'(GMT). Below are the statistics from the batch run:'+
				'<br/>'+
				'Start Date & time (GMT): '+string.valueOf(batchStartTime)+'(GMT)'+
				'<br/>'+
				'End Date & time (GMT): '+string.valueOf(system.now())+'(GMT)'+
                '<br/>'+
                'Total Orders(Eset Level) Picked by Batch: '+string.valueOf(totalOrdersPickedInBatch)+
                '<br/>'+
                'Total Orders (Aggrgated) processed: '+string.valueOf(processedGONs.size())+
                '</p>'+
                '<p>'+
                'Regards'+
                '<br/>'+
                'myGEHealthCare Support'+
                '</p>';
            
            List<OrgWideEmailAddress> owaList = [Select Id from OrgWideEmailAddress where Address = 'mygehealthcare.support@ge.com' limit 1];
            Messaging.SingleEmailMessage[] emailMessages = new List<Messaging.SingleEmailMessage>();
            Messaging.SingleEmailMessage emailMsg = new Messaging.SingleEmailMessage();
            emailMsg.setHtmlBody(emailHtmlBody);
            emailMsg.setsubject('Customer Portal: Order Header Batch Run Status');
            emailMsg.setToAddresses(emailAddresses);
            if(owaList != null && owaList.size() > 0){
                emailMsg.setOrgWideEmailAddressId(owaList[0].Id);
            }
            emailMessages.add(emailMsg);
            if(!emailMessages.isEmpty()){
                Messaging.sendEmail(emailMessages);
            }
        }
    }
    
    private List<CCP_OrderDataWrapper> fetchOrders(set<string> GONs){
        Map<string, Map<string, List<Order__c>>> orderLevelData = new Map<string, Map<string, List<Order__c>>>();
        for(Order__c order:[Select Id,
                            Name, 
                            Global_Order_Number__c,            
                            Fset__c,
                            ESet__c,                  
                            AOSD__c,
                            ASDD__c,
                            ATD_CTD__c,
                            ATD1__c,
                            ATD2__c,
                            CTD1__c,
                            CTD2__c,                 
                            ROSD__c,
                            RSDD__c,
                            SOSD__c,
                            SSDD__c,
                            Order_Initiation_Date__c,
                            Order_Status__c,
                            Order_Source__c,
                            PSI_Code__c,
                            PSI_Description__c,
                            Quantity__c,
                            Sub_Region__c,
                            Bill_to_Account__c,
                            Ship_to_Account__c,
                            Ship_to_Account__r.Name,
                            Ship_to_Account__r.Primary_Address__c,
                            Bill_To_UCM_ID__c,
                            Ship_To_UCM_ID__c,       
                            Country_Code__c,
                            Customer_Address__c,
                            Customer_City__c,
                            Customer_Name__c,
                            Customer_PO__c,
                            Customer_State__c,
                            Customer_Zip_Postal_Code__c,
                            Order_Type__c,
                            Product_Name__c,
                            CurrencyIsoCode,                
                            Global_Region__c,              
                            Rev_Rec_Terms__c,          
                            Amount_k_in_Local_Curr__c,
                            Order_ESet_Amount_LocalCurr__c,
                            Order_Approval_Date__c,
                            Shipping_Address_City__c,
                            Shipping_Address_Line_1__c,
                            Shipping_Address_Line_2__c,
                            Shipping_Address_Line_3__c,
                            Shipping_Address_Line_4__c,
                            Shipping_Address_State__c,
                            Shipping_Address_Zip__c,
                            Shipping_Address_Country__c
                            from Order__c
                            where Global_Order_Number__c IN :GONs
                            AND Global_Order_Number__c NOT IN :processedGONs
                            AND (Ship_To_UCM_ID__c != null OR Bill_To_UCM_ID__c != null)
                            AND Deleted_In_BI__c = false]){
                                if(orderLevelData.containsKey(order.Global_Order_Number__c)){
                                    if(orderLevelData.get(order.Global_Order_Number__c) != null){
                                        if(orderLevelData.get(order.Global_Order_Number__c).containsKey(order.Fset__c)){
                                            orderLevelData.get(order.Global_Order_Number__c).get(order.Fset__c).add(order);
                                        }else{
                                            List<Order__c> tempList = new List<Order__c>();
                                            tempList.add(order);
                                            orderLevelData.get(order.Global_Order_Number__c).put(order.Fset__c, tempList);
                                        }
                                    }
                                }else{
                                    List<Order__c> tempList = new List<Order__c>();
                                    tempList.add(order);
                                    Map<string, list<Order__c>> tempMap = new Map<string, list<Order__c>>();
                                    tempMap.put(order.Fset__c, tempList);
                                    orderLevelData.put(order.Global_Order_Number__c, tempMap);
                                }
                            }
        return createOrderWrapper(orderLevelData);
    }
    
    private List<CCP_OrderDataWrapper> createOrderWrapper(Map<string, map<string, list<Order__c>>> orderLevelData){
        List<CCP_OrderDataWrapper> orderWrappers = new List<CCP_OrderDataWrapper>();
        for(string GON:orderLevelData.keyset()){
            CCP_OrderDataWrapper orderWrap = new CCP_OrderDataWrapper();
            orderWrap.GON = GON;
            orderWrap.OrderStatus = 'Closed';
            orderWrap.statusSortCode = 2;
            orderWrap.TotalOrderValue = 0.0;
            set<string> tempBillToUCMIds = new set<string>();
            set<string> tempShipToUCMIds = new set<string>();
            map<string, list<Order__c>> tempFsetMap = orderLevelData.get(GON);
            list<string> tempFsetList = new list<string>();
            tempFsetList.addAll(tempFsetMap.keySet());
            tempFsetList.sort();
            string firstEset = tempFsetMap.get(tempFsetList[0])[0].Eset__c;
            orderWrap.addressCity = tempFsetMap.get(tempFsetList[0])[0].Shipping_Address_City__c;
            orderWrap.addressLine1 = tempFsetMap.get(tempFsetList[0])[0].Shipping_Address_Line_1__c;
            orderWrap.addressLine2 = tempFsetMap.get(tempFsetList[0])[0].Shipping_Address_Line_2__c;
            orderWrap.addressLise3 = tempFsetMap.get(tempFsetList[0])[0].Shipping_Address_Line_3__c;
            orderWrap.addressLine4 = tempFsetMap.get(tempFsetList[0])[0].Shipping_Address_Line_4__c;
            orderWrap.addressState = tempFsetMap.get(tempFsetList[0])[0].Shipping_Address_State__c;
            orderWrap.addressZip = tempFsetMap.get(tempFsetList[0])[0].Shipping_Address_Zip__c;
            orderWrap.currencyCode = tempFsetMap.get(tempFsetList[0])[0].CurrencyIsoCode;
            orderWrap.addressCountry = tempFsetMap.get(tempFsetList[0])[0].Shipping_Address_Country__c;
            for(Order__c eset:tempFsetMap.get(tempFsetList[0])){
                if(integer.valueOf(eset.ESet__c) < integer.valueOf(firstEset)){
                    firstEset = eset.ESet__c;
                    orderWrap.addressCity = eset.Shipping_Address_City__c;
                    orderWrap.addressLine1 = eset.Shipping_Address_Line_1__c;
                    orderWrap.addressLine2 = eset.Shipping_Address_Line_2__c;
                    orderWrap.addressLise3 = eset.Shipping_Address_Line_3__c;
                    orderWrap.addressLine4 = eset.Shipping_Address_Line_4__c;
                    orderWrap.addressState = eset.Shipping_Address_State__c;
                    orderWrap.addressZip = eset.Shipping_Address_Zip__c;
                    orderWrap.currencyCode = eset.CurrencyIsoCode;
                    orderWrap.addressCountry = eset.Shipping_Address_Country__c;
                }
            }
            List<CCP_FsetDataWrapper> FsetList = new List<CCP_FsetDataWrapper>();
            for(string Fset:tempFsetMap.keySet()){
                List<Order__c> tempEsetList = tempFsetMap.get(Fset);
                orderWrap.PONumber = tempEsetList[0].Customer_PO__c;
                orderWrap.CustomerName = tempEsetList[0].Customer_Name__c;
                orderWrap.customerCity = tempEsetList[0].Customer_City__c;
                orderWrap.CustomerAddress = tempEsetList[0].Customer_Address__c;
                orderWrap.countryCode = tempEsetList[0].Country_Code__c;
                orderWrap.cutomerState = tempEsetList[0].Customer_State__c;
                orderWrap.customerZip = tempEsetList[0].Customer_Zip_Postal_Code__c;
                orderWrap.OrderSource = tempEsetList[0].Order_Source__c;
                orderWrap.OrderInitiationDate_ISO = tempEsetList[0].Order_Initiation_Date__c;
                if(tempEsetList[0].Order_Approval_Date__c != null){
                    orderWrap.OrderApprovalDate_ISO = tempEsetList[0].Order_Approval_Date__c.date();
                    orderWrap.OrderApprovalDateTime = tempEsetList[0].Order_Approval_Date__c;
                }
                If(tempEsetList[0].Order_Status__c != 'Closed' && tempEsetList[0].Order_Status__c != 'Cancelled' && tempEsetList[0].Order_Status__c != 'Entered'){
                    for(Order__c Eset:tempEsetList){
                        if(Eset.ATD2__c == null){
                            orderWrap.OrderStatus = 'Open';
                            orderWrap.statusSortCode = 1;
                        }
                    }
                }else if(tempEsetList[0].Order_Status__c == 'Cancelled'){
                    orderWrap.OrderStatus = 'Cancelled';
                    orderWrap.statusSortCode = 0;
                }else if(tempEsetList[0].Order_Status__c == 'Entered'){
                    orderWrap.OrderStatus = 'Entered';
                } 
                for(Order__c Eset:tempEsetList){
                    if(Eset.Order_ESet_Amount_LocalCurr__c != null)
                        orderWrap.TotalOrderValue = orderWrap.TotalOrderValue + Eset.Order_ESet_Amount_LocalCurr__c;
                    tempBillToUCMIds.add(Eset.Bill_To_UCM_ID__c);
                    tempShipToUCMIds.add(Eset.Ship_To_UCM_ID__c);
                }
                CCP_FsetDataWrapper FsetWrap = new CCP_FsetDataWrapper();
                FsetWrap.ShipmentSet = Fset;
                FsetWrap.initiatedDate_ISO = orderWrap.OrderApprovalDate_ISO;
                FsetWrap.Amount = 0.0;
                decimal maxAmount = tempEsetList[0].Order_ESet_Amount_LocalCurr__c;
                FsetWrap.Description = tempEsetList[0].PSI_Description__c;
                FsetWrap.addressCity = tempEsetList[0].Shipping_Address_City__c;
                FsetWrap.addressLine1 = tempEsetList[0].Shipping_Address_Line_1__c;
                FsetWrap.addressLine2 = tempEsetList[0].Shipping_Address_Line_2__c;
                FsetWrap.addressLise3 = tempEsetList[0].Shipping_Address_Line_3__c;
                FsetWrap.addressLine4 = tempEsetList[0].Shipping_Address_Line_4__c;
                FsetWrap.addressState = tempEsetList[0].Shipping_Address_State__c;
                FsetWrap.addressZip = tempEsetList[0].Shipping_Address_Zip__c;
                FsetWrap.CustomerName = tempEsetList[0].Customer_Name__c;
                FsetWrap.currencyCode = tempEsetList[0].CurrencyIsoCode;
                FsetWrap.addressCountry = tempEsetList[0].Shipping_Address_Country__c;
                string ShippedDateField = 'ASDD__c';
                string DeliveredDateField = 'AOSD__c';
                string CompletedDateField = 'ATD2__c';
                for(Order__c Eset:tempEsetList){
                    if(Eset.Order_ESet_Amount_LocalCurr__c != null)
                        FsetWrap.Amount = FsetWrap.Amount + Eset.Order_ESet_Amount_LocalCurr__c;
                    if(Eset.Order_ESet_Amount_LocalCurr__c > maxAmount){
                        maxAmount = Eset.Order_ESet_Amount_LocalCurr__c;
                        FsetWrap.Description = Eset.PSI_Description__c;
                        FsetWrap.addressCity = Eset.Shipping_Address_City__c;
                        FsetWrap.addressLine1 = Eset.Shipping_Address_Line_1__c;
                        FsetWrap.addressLine2 = Eset.Shipping_Address_Line_2__c;
                        FsetWrap.addressLise3 = Eset.Shipping_Address_Line_3__c;
                        FsetWrap.addressLine4 = Eset.Shipping_Address_Line_4__c;
                        FsetWrap.addressState = Eset.Shipping_Address_State__c;
                        FsetWrap.addressZip = Eset.Shipping_Address_Zip__c;
                        FsetWrap.CustomerName = Eset.Customer_Name__c;
                        FsetWrap.currencyCode = Eset.CurrencyIsoCode;
                        FsetWrap.addressCountry = Eset.Shipping_Address_Country__c;
                    }
                    if(Eset.ASDD__c == null){
                        ShippedDateField = 'SSDD__c'; 
                    }
                    if(Eset.AOSD__c == null){
                        DeliveredDateField = 'SOSD__c'; 
                    }
                    if(Eset.ATD2__c == null){
                        CompletedDateField = null;
                    }
                }
                date tempShippedDate = (date)tempEsetList[0].get(ShippedDateField);
                date tempDeliveredDate = (date)tempEsetList[0].get(DeliveredDateField);
                date tempCompletedDate;
                if(CompletedDateField != null){
                    tempCompletedDate = (date)tempEsetList[0].get(CompletedDateField);
                }
                for(Order__c Eset:tempEsetList){
                    if((date)Eset.get(ShippedDateField) > tempShippedDate){
                        tempShippedDate = (date)Eset.get(ShippedDateField);
                    }
                    if((date)Eset.get(DeliveredDateField) > tempDeliveredDate){
                        tempDeliveredDate = (date)Eset.get(DeliveredDateField);
                    }
                    if(CompletedDateField != null){
                        if((date)Eset.get(CompletedDateField) > tempCompletedDate){
                            tempCompletedDate = (date)Eset.get(CompletedDateField);
                        }
                    }
                }
                FsetWrap.shippeddate_ISO = tempShippedDate;
                if(ShippedDateField == 'SSDD__c'){
                    FsetWrap.isShippingComplete = false;
                }else{
                    FsetWrap.isShippingComplete = true;
                }
                FsetWrap.delivereddate_ISO = tempDeliveredDate;
                if(DeliveredDateField == 'SOSD__c'){
                    FsetWrap.isDeliveryComplete = false;
                }else{
                    FsetWrap.isDeliveryComplete = true;
                }
                FsetWrap.completeddate_ISO = tempCompletedDate;
                FsetList.add(FsetWrap);
            }
            orderWrap.Fsets = FsetList;
            orderWrap.BTAccountUCMIds = '';
            orderWrap.STAccountUCMIds = '';
            for(string BTUCMID:tempBillToUCMIds){
                orderWrap.BTAccountUCMIds = orderWrap.BTAccountUCMIds + BTUCMID + ';';
            }
            for(string STUCMID:tempShipToUCMIds){
                orderWrap.STAccountUCMIds = orderWrap.STAccountUCMIds + STUCMID + ';';
            }
            orderWrappers.add(orderWrap);
        }
        return orderWrappers;
    }
}