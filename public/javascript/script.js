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
  function productDelete(cartId,productId,prodName){

    swal({
        title: "Are you sure?",
        text: "remove "+prodName+" from cart",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      })
      .then((willDelete) => {
        if (willDelete) {
            $.ajax({
                url:'/delete-cart-product',
                data:{
                   product:productId,
                   cart:cartId
               },
               method:'post',
               success:(response)=>{
                   $('#tr'+proId).remove()
                   let msg=prodName+' removed'
                   $('#delete-msg').html(msg)
                   
           
               }
           })
          swal(prodName+" has removed from cart", {
            icon: "success",
          });
        } else {
          swal("deletion aborted");
        }
      });

 
}


//   function addToWishlist(userId,proId){
//     $.ajax({
//         url:'/add-to-wishlist/'+proId,
//         data:{
//             userId:userId,
//             productId:proId
//         },
//         method:'post',
//         success:(response)=>{
//             if (response.status){
//                 $('#like'+proId).hide()
//                 $('#like2'+proId).hide()
               

//             }else{
//                 $('#like'+proId).show()
//                 $('#like2'+proId).show()
//             }
                
//         }


//     })
// }

// function unWish(userId, proId) {
//   let div = document.querySelector(".liked"+proId)
//   div.classList.add("hide-like-btn")
  
  
//   $.ajax({
//       url: '/wishlist',
//       data:{
//           userId:userId,
//           productId:proId
//       },
//       method:'post',
//       success: (response) => {
//           console.log(response);
//           if (!response.status) {
             
//           }
          
//       }
//   })
 
// }
// function removeWish(proId){
//   $.ajax({
//       url:'/remove-wish?id='+proId,
//       method:'get',
//       success:(response)=>{
          
//           location.reload();
//       }
      
//   })
// }

