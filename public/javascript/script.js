function addToCart(productId){
    $.ajax({
      url:'/add-to-cart/'+productId,
      method:'get',
      success:(response)=>{
        if(response.status){
            let count=$('#cart-count').html()
            count=parseInt(count)+1
            $("#cart-count").html(count)
        }
        // alert(response)
      }
    })
  }

function addToWishlist(productId){
    $.ajax({
      url:'/add-to-wishlist/'+productId,
      method:'get',
      success:(response)=>{
        if(response.status){
            let count=$('#cart-count').html()
            count=parseInt(count)+1
            $("#cart-count").html(count)
        }
        // alert(response)
      }
    })
  }

  function addToWishlist(userId,proId){
    $.ajax({
        url:'/add-to-wishlist/'+proId,
        data:{
            userId:userId,
            productId:proId
        },
        method:'post',
        success:(response)=>{
            if (response.status){
                $('#like'+proId).hide()
                $('#like2'+proId).hide()
               

            }else{
                $('#like'+proId).show()
                $('#like2'+proId).show()
            }
                
        }


    })
}

function unWish(userId, proId) {
  let div = document.querySelector(".liked"+proId)
  div.classList.add("hide-like-btn")
  
  
  $.ajax({
      url: '/wish-list',
      data:{
          userId:userId,
          productId:proId
      },
      method:'post',
      success: (response) => {
          console.log(response);
          if (!response.status) {
             
          }
          
      }
  })
 
}
function removeWish(proId){
  $.ajax({
      url:'/remove-wish?id='+proId,
      method:'get',
      success:(response)=>{
          
          location.reload();
      }
      
  })
}