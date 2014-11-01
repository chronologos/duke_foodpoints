function format(input) {
    return moment(Number(input)).format("MMMM Do YYYY, h:mm:ss a");
}
$( document ).ready(function() {
    $('.format').each(function(){
        $(this).text(format($(this).text()))
    })
    $('#transactions').DataTable(
        {
            searching: false,
            lengthChange: false,
            ordering: false,
            "pagingType": "simple"

        }
    );

})