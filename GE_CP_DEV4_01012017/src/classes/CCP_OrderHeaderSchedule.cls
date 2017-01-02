public class CCP_OrderHeaderSchedule implements schedulable {
    public void execute(SchedulableContext SC){
        database.executeBatch(new CCP_OrderHeaderBatch(), 2000);
    }
}