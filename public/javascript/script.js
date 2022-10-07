function addToCart(productId){
    $.ajax({
      url:'/add-to-cart/'+productId,
      method:'get',
      success:(response)=>{
        if(response.status){
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          })
          
          Toast.fire({
            icon: 'success',
            title: 'Added to Cart'
          })
            let count=$('#cart-count').html()
            count=parseInt(count)+1
            $("#cart-count").html(count)
        }else{
          location.href='/login'
        }
        // alert(response)
      }
    })
  }
function addToCartWish(productId){
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
  function checkWish() {
    fetch(`/check-wishlist/${proId}`).then(response => response.json())
      .then(response => {
        console.log(response)

      })
  }



  function wish(proId) {
    console.log(proId)
    $.ajax({
      url: `/add-to-wishlist/${proId}`,

      method: 'get',
      success: (response) => {
        console.log("respo",response)
        if (response.status) {

          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          })

          Toast.fire({
            icon: 'success',
            title: 'Signed in successfully'
          })
          let count = $('#wish-count').html()
          count = parseInt(count) + 1
          $("#wish-count").html(count)
        }

      }


    })
  }

  function wishList(userId, proId) {
    console.log("pro", proId)
    console.log("user", userId)
    $.ajax({
      url: '/wish-list',
      data: {
        user: userId,
        proId: proId
      },
      method: 'post',
      success: (response) => {
        if (response.status) {

          const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          })

          Toast.fire({
            icon: 'success',
            title: 'Added to Wishlist'
          })
          $('#like' + proId).hide()
          $('#like2' + proId).hide()


        } else {
          $('#like' + proId).show()
          $('#like2' + proId).show()
          const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          })

          Toast.fire({
            icon: 'success',
            title: 'Removed from Wishlist'
          })
        }

      }


    })
  }

  function unWish(userId, proId) {
     console.log("pro", proId)
    console.log("user", userId)
    let div = document.querySelector(".liked" + proId)
    div.classList.add("hide-like-btn")


    $.ajax({
      url: '/wish-list',
      data: {
        user: userId,
        proId: proId
      },
      method: 'post',
      success: (response) => {
        console.log(response);
        if (!response.status) {

          const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          })

          Toast.fire({
            icon: 'success',
            title: 'removed from Wishlist'
          })
        }

      }
    })

  }
  // Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  //     return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  // });

  function removeWish(proId) {
    swal({
      title: "Are you sure?",
      text: "remove  from wishlist",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
      .then((willDelete) => {
        if (willDelete) {
          $.ajax({
            url: '/remove-wish?id=' + proId,
            method: 'get',
            success: (response) => {

              location.reload();
            }

          })

        } else {

        }
      });

  }

