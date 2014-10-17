function format(input) {
    return moment(Number(input)).format("dddd, MMMM Do YYYY, h:mm:ss a");
}
$( document ).ready(function() {
    $('.format').each(function(){
        $(this).text(format($(this).text()))
    })
})