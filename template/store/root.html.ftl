<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Store</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.2/css/bootstrap.min.css" integrity="sha256-zVUlvIh3NEZRYa9X/qpNY8P1aBy0d4FrI7bhfZSZVwc=" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.0.9/css/all.css" integrity="sha384-5SOiIsAziJl6AWe0HWRKTXlfcSHKmYV4RBF18PPJ173Kzn7jzMyFuTtk8JA7QQG1" crossorigin="anonymous">
    <link rel="stylesheet" href="/store/components/styles.css">
</head>

<body>
    <div id="store-root">
        ${sri.renderSubscreen()}
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.2/js/bootstrap.min.js" integrity="sha256-IeI0loa35pfuDxqZbGhQUiZmD2Cywv1/bdqiypGW46o=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mouse0270-bootstrap-notify/3.1.7/bootstrap-notify.min.js" integrity="sha256-LlN0a0J3hMkDLO1mhcMwy+GIMbIRV7kvKHx4oCxNoxI=" crossorigin="anonymous"></script>
<script>
    var urlCartAdd = "s1/pop/cart/add";
    var urlAddReview = "s1/pop/products/reviews";
    var urlLogOut = "s1/pop/logout";

    $(document).ready(function() {
        $('#recipeCarousel').carousel({
            interval: 10000
        });

        $('.carousel .carousel-item').each(function(){
            var next = $(this).next();
            if (!next.length) {
                next = $(this).siblings(':first');
            }
            next.children(':first-child').clone().appendTo($(this));
    
            for (var i=0;i<2;i++) {
                next=next.next();
                if (!next.length) {
                    next = $(this).siblings(':first');
                }
                next.children(':first-child').clone().appendTo($(this));
            }
        });
       

        $("#cartAdd").click(function() {
            $.post(storeConfig.restApiLocation + urlCartAdd,$("#cart-add-form").serialize(), function(data) {
                $("#isSuccessAddCart").show();
                var quantity = 0;
                for (var i = 0; i < data.orderItemList.length; i++) {
                    if (data.orderItemList[i].itemTypeEnumId === "ItemProduct") { quantity++; }
                }
                $("#cart-quantity").text(quantity);
            });
        });
        $("#addReview").click(function(){
            $.post(storeConfig.restApiLocation + urlAddReview,$("#product-review-form").serialize(), function(data) {
                $('#product-review-form').trigger("reset");
            });
        });
        $("#logout").click(function(){
            $.get(storeConfig.restApiLocation + urlLogOut, function(data){
                window.location.href = "/store";
                location.reload();
            });
        });
        $("#form-search").submit(function(event){
            event.preventDefault();
            window.location.href = "/store/d#/search/" + $(this).serializeArray()[0].value;
        });

        var $starsLi = $('#stars li');
        $starsLi.on('mouseover', function() {
            var onStar = parseInt($(this).data('value'), 10);
            $(this).parent().children('li.star').each(function(e){
                if (e < onStar) { $(this).addClass('hover'); } else { $(this).removeClass('hover'); } });
        }).on('mouseout', function() {
            $(this).parent().children('li.star').each(function(e) { $(this).removeClass('hover'); });
        });
        $starsLi.on('click', function() {
           var onStar = parseInt($(this).data('value'), 10);
           //the number of stars is assigned 
           $("#productRating").val(onStar);
           var stars = $(this).parent().children('li.star');
           for (i = 0; i < stars.length; i++) { $(stars[i]).removeClass('selected'); }
           for (i = 0; i < onStar; i++) { $(stars[i]).addClass('selected'); }
        });
    });
</script>
    <#-- for scripts/etc from d.xml or others, ie client rendered part of site that needs more JS -->
    <#if footerScriptText?has_content>${footerScriptText}</#if>
</body>
</html>
