public without sharing class CCP_InvoiceDataController {
	public static Integer myInvoicesChunkSize = 120;
	
	@AuraEnabled
    public static Map<string, string> fetchInvoicesJSON(string GON){
        try{
            Map<string, string> m = new Map<string, string>();
            m.put('GON', String.valueOf(GON));
            //m.put('invoices', JSON.serialize(CCP_DatabaseUtility.fetchOrderInvoices(GON)));
            system.debug('***'+string.valueOf(GON));
            m.put('invoices', CCP_DatabaseUtility.fetchMyInvoices(null, null, null, null, null, null, 0, string.valueOf(GON)).get('invoices'));
            return m;
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_InvoiceDataController.fetchInvoicesJSON', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
        
    } 
    
    @AuraEnabled
    public static string searchInvoices(string GON, string inputSearch){
        try{
           return CCP_DatabaseUtility.fetchMyInvoices(inputSearch, null, null, null, null, null, 0, string.valueOf(GON)).get('invoices'); 
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_InvoiceDataController.searchInvoices', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
		
    }
    
    /*@AuraEnabled
    public static string searchInvoices(string GON, string inputSearch){
        if(inputSearch == 'Saurabh'){
            return JSON.serialize(new List<CCP_InvoiceDataWrapper>());
        }
        return JSON.serialize(CCP_DatabaseUtility.searchOrderInvoices(GON, inputSearch));
    }*/
    
	@AuraEnabled
    public static Map<string, string> fetchMyInvoicesJSON(String inputSearch, String sortType, String sortOrder, 
												String fromDate, String toDate, String invoiceStatusFilter, Integer offset, string defaultDateFlag){
                                                    try{
                                                        Integer recCount = 500;
                                                        if (inputSearch != '')
                                                        {
                                                            recCount = 300;
                                                        }
                                                        system.debug('&&&'+fromDate+'&&&'+toDate+'&&&'+string.valueOf(defaultDateFlag));
                                                        if(string.isBlank(fromDate) && string.valueOf(defaultDateFlag) == 'true'){
                                                            date defaultFromDate = system.today().addMonths(-6).addDays(1);
                                                            fromDate = string.valueOf(defaultFromDate);
                                                        } 
                                                        if(string.isBlank(toDate) && string.valueOf(defaultDateFlag) == 'true'){
                                                            date defaultToDate = system.today();
                                                            toDate = string.valueOf(defaultToDate);
                                                        }                                            
                                                        Map<string, string> invMap = CCP_DatabaseUtility.fetchMyInvoices(inputSearch, sortType, sortOrder, fromDate, toDate, invoiceStatusFilter, integer.valueOf(offset), null);                                                                                                                        
                                                        system.debug('***'+invMap.get('invoices'));
                                                        Map<string, string> m = new Map<string, string>();
                                                        m.put('totalRecords', invMap.get('totalRecords'));
                                                        m.put('chunkSize', String.valueOf(myInvoicesChunkSize));
                                                        m.put('invoices', invMap.get('invoices'));
                                                        return m; 
                                                    }catch(exception ex){
                                                        CCP_DatabaseUtility.createErrorRecord('CCP_InvoiceDataController.fetchMyInvoicesJSON', ex.getMessage(), userInfo.getUserId());
                                                        throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
                                                        return null;
                                                    }
	}
	
	@AuraEnabled
    public static CCP_OrderDataWrapper fetchOrderDetails(String GON, String FSetNumber){
        try{
            CCP_OrderDataWrapper orderWrap = new CCP_OrderDataWrapper();
            set<string> GONs = new set<string>{string.valueOf(GON)};
                for(Order_Header__c orderHeader:[Select Id, PO_Number__c,CurrencyISOCode, Order_Number__c, Shipping_Address__c,Customer_Name__c,Facility_Name__c, Order_Date__c, Order_Status__c,Total_Order_Value__c,StatusSortCode__c,Order_Source__c, BT_Account_UCM_Ids__c, ST_Account_UCM_Ids__c, (Select Id,Shipment_Set_Number__c,CurrencyISOCode,Description__c,Amount__c, Ultimate_Shipping_Address__c, Shipped_Date__c, isShippingComplete__c, Delivered_Date__c, isDeliveryComplete__c, Completed_Date__c,  Ultimate_Shipping_Address_Line_1__c, Ultimate_Shipping_Address_Line_2__c, Ultimate_Shipping_Address_Line_3__c, Ultimate_Shipping_Address_Line_4__c, Ultimate_Shipping_Address_State__c, Ultimate_Shipping_Address_City__c, Ultimate_Shipping_Address_Zip__c, Ultimate_Shipping_Address_Country_Code__c from Shipment_Details__r) FROM Order_Header__c where Order_Number__c IN :GONs limit 1]){
                    orderWrap.GON = orderHeader.Order_Number__c;
                    orderWrap.PONumber = orderHeader.PO_Number__c;
                    datetime OID = orderHeader.Order_Date__c;
                    if(OID != null){
                        orderWrap.OrderApprovalDate = OID.format('d MMM yyyy');
                    }
                    orderWrap.OrderStatus = orderHeader.Order_Status__c;
                    orderWrap.InvoiceFSet = 'Not Available';
                    orderWrap.CustomerName = 'Not Available';
                    orderWrap.InvoiceFSetAmount = null;
                    orderWrap.InvoiceFSetAddress = null;
                    orderWrap.currencyCode = null;
                    
                    if(orderHeader.Shipment_details__r.size() > 0){
                        for(Shipment_Detail__c fset:orderHeader.Shipment_details__r){
                            if(string.valueOf(fset.Shipment_Set_Number__c) == FSetNumber){
                                orderWrap.InvoiceFSet = string.valueOf(fset.Shipment_Set_Number__c);
                                orderWrap.InvoiceFSetAmount = fset.Amount__c;
                                orderWrap.InvoiceFSetAddress = fset.Ultimate_Shipping_Address__c;
                                orderWrap.addressLine1 = (fset.Ultimate_Shipping_Address_Line_1__c != null?fset.Ultimate_Shipping_Address_Line_1__c.toUpperCase():'') + ' ' + (fset.Ultimate_Shipping_Address_Line_2__c != null?fset.Ultimate_Shipping_Address_Line_2__c.toUpperCase():(fset.Ultimate_Shipping_Address_Line_3__c != null?fset.Ultimate_Shipping_Address_Line_3__c.toUpperCase():(fset.Ultimate_Shipping_Address_Line_4__c != null?fset.Ultimate_Shipping_Address_Line_4__c.toUpperCase():'')));
                        		orderWrap.addressLine2 = (fset.Ultimate_Shipping_Address_City__c != null?fset.Ultimate_Shipping_Address_City__c.toUpperCase():'')+' '+(fset.Ultimate_Shipping_Address_State__c != null?fset.Ultimate_Shipping_Address_State__c.toUpperCase():'');
                        		orderWrap.addressLise3 = (fset.Ultimate_Shipping_Address_Zip__c != null?fset.Ultimate_Shipping_Address_Zip__c.toUpperCase():'') +' '+(fset.Ultimate_Shipping_Address_Country_Code__c != null?fset.Ultimate_Shipping_Address_Country_Code__c.toUpperCase():'');
                                orderWrap.CustomerName = orderHeader.Customer_Name__c;
                                orderWrap.currencyCode = fset.CurrencyISOCode;
                            }
                        }
                    }
                }
            return orderWrap; 
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_InvoiceDataController.fetchOrderDetails', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
        
    }
	
    @AuraEnabled
    public static map<String, String> createDatesArray(){
        try{
            String todayDisplay = system.now().format('d MMM yyyy');
            Date last6Months = system.today().addMonths(-6).addDays(1);
            Datetime dt = datetime.newInstance(last6Months.year(), last6Months.month(), last6Months.day());
            String last6MonthsDisplay = dt.format('d MMM yyyy');
            
            return new map<String, String>{
                'Today' => String.valueOf(system.today()),
                'TodayDisplay' => todayDisplay,
                'Last30Days' => String.valueOf(system.today().addDays(-29)),
                'Last60Days' => String.valueOf(system.today().addDays(-59)),
                'Last6Months' => String.valueOf(last6Months),
                'Last6MonthsDisplay' => last6MonthsDisplay
            };
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_InvoiceDataController.createDatesArray', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
        
    }
}