@isTest
private class CCP_OrderHeaderBatchTest{
	static testmethod void testExecute(){
		CCP_BatchConfig__c bc = new CCP_BatchConfig__c();
        bc.Name = 'OrderBatchConfig';
        bc.Hours__c = 1;
        bc.Email__c = 'test@test.com';
        insert bc;
        List<Order__c> orderList = new List<Order__c>();
        Order__c testOrder = new Order__c();
        testOrder.Name = '110011-1-1';
        testOrder.Global_Order_Number__c = '110011';
        testOrder.Ship_To_UCM_ID__c = '1-ABC';
        testOrder.Order_ESet_Amount_LocalCurr__c = 100.00;
        testOrder.Order_Approval_Date__c = system.today();
        orderList.add(testOrder);
        Order__c testOrder1 = new Order__c();
        testOrder1.Name = '110011-1-2';
        testOrder1.Global_Order_Number__c = '110011';
        testOrder1.Ship_To_UCM_ID__c = '1-ABC';
        testOrder1.Order_ESet_Amount_LocalCurr__c = 100.00;
        testOrder1.Order_Approval_Date__c = system.today();
        orderList.add(testOrder1);
        Order__c testOrder2 = new Order__c();
        testOrder2.Name = '110011-2-1';
        testOrder2.Global_Order_Number__c = '110011';
        testOrder2.Ship_To_UCM_ID__c = '1-ABC';
        testOrder2.Order_ESet_Amount_LocalCurr__c = 100.00;
        testOrder2.Order_Approval_Date__c = system.today();
        orderList.add(testOrder2);
        Order__c testOrder3 = new Order__c();
        testOrder3.Name = '110012-2-1';
        testOrder3.Global_Order_Number__c = '110012';
        testOrder3.Ship_To_UCM_ID__c = '1-ABC';
        testOrder3.Order_Status__c = 'Cancelled';
        orderList.add(testOrder3);
        Order__c testOrder4 = new Order__c();
        testOrder4.Name = '110013-2-1';
        testOrder4.Global_Order_Number__c = '110013';
        testOrder4.Ship_To_UCM_ID__c = '1-ABC';
        testOrder4.Order_Status__c = 'Entered';
        orderList.add(testOrder4);
        insert orderList;
        Order_Header__c oHead = new Order_Header__c();
        oHead.Order_Number__c = '110011';
        insert oHead;
        Shipment_Detail__c sDet = new Shipment_Detail__c();
        sDet.Order_Header__c = oHead.Id;
        sDet.Shipment_Set_Number__c = 1;
        insert sDet;
        Test.startTest();
        database.executeBatch(new CCP_OrderHeaderBatch());
        Test.stopTest();
    }
}