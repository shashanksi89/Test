@isTest(seeAllData = true)
private class CCP_InvoiceDataControllerTest {
    static testMethod void testcreateDatesArray(){
        CCP_InvoiceDataController.createDatesArray();
    }
    
    static testMethod void testfetchInvoicesJSON(){
        CCP_InvoiceDataController.fetchInvoicesJSON('110011');
    }
    
    static testMethod void testsearchInvoices(){
        CCP_InvoiceDataController.searchInvoices('110011', '1100');
    }
    
    static testMethod void testfetchMyInvoicesJSON(){
        CCP_InvoiceDataController.fetchMyInvoicesJSON('', '', '','','','',0,'true');
        CCP_InvoiceDataController.fetchMyInvoicesJSON('', 'InvoiceDate', '','','','Open',0,'true');
        CCP_InvoiceDataController.fetchMyInvoicesJSON('', 'InvoiceValue', '','','','Closed',0,'true');
        CCP_InvoiceDataController.fetchMyInvoicesJSON('', 'InvoiceStatus', '','','','Open',null,'true');
    }
    
    static testMethod void testFetchOrderDetail(){
        Order_Header__c orderHeader = new Order_Header__c ();      
        orderHeader.PO_Number__c = '90091';
        orderHeader.CurrencyISOCode = 'USD';
        orderHeader.Order_Number__c =  '110011';        
        orderHeader.Customer_Name__c = 'RAPIDES REGIONAL MEDICAL CENTER';     
        orderHeader.Order_Date__c = system.today();
        orderHeader.Order_Status__c = 'Closed';
        orderHeader.Total_Order_Value__c = 0.0;
        orderHeader.StatusSortCode__c = 2.0;
        orderHeader.Order_Source__c = 'eOM';
        orderHeader.BT_Account_UCM_Ids__c = '1-ABC';
        orderHeader.ST_Account_UCM_Ids__c = '1-ABC';
        insert orderHeader;
        List<Shipment_Detail__c> shipList = new List<Shipment_Detail__c>();
        Shipment_Detail__c shipmentDetail = new Shipment_Detail__c();  
        shipmentDetail.Order_Header__c = orderHeader.Id;      
        shipmentDetail.Shipment_Set_Number__c = 1.0;
        shipmentDetail.CurrencyISOCode = 'USD';
        shipmentDetail.Description__c = 'IIS OTHER';
        shipmentDetail.Amount__c = 0.0;      
        shipmentDetail.Shipped_Date__c = system.today()-5;
        shipmentDetail.isShippingComplete__c = true;
        shipmentDetail.Delivered_Date__c = system.today()-5;
        shipmentDetail.isDeliveryComplete__c = true;
        shipmentDetail.Completed_Date__c = system.today();   
        shipList.add(shipmentDetail);
        insert shipList;
        CCP_InvoiceDataController.fetchOrderDetails('110011', '1');
    }
}