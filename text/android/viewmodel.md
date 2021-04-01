# ViewModel

So far we’ve been doing our data fetching directly in our fragments, which means that every time a fragment is re-created (for example, on rotation), we call the API again. Android recommends using [`ViewModel`](https://developer.android.com/topic/libraries/architecture/viewmodel) classes to “store and manage UI-related data in a lifecycle conscious way.” In addition to being more efficient, it helps avoid bugs: a common lifecycle bug happens when we access a view after `onDestroyView` is called. A fragment can be in this state after we navigate away from it but before it has been destroyed. In the app we built in the last section, we avoided this by using `.launchWhenStarted`, which suspends execution when the view is destroyed. If we had used `.launch`, execution could continue past `onDestroyView` and cause a crash. 

The [viewmodel](https://github.com/GraphQLGuide/guide-android/tree/viewmodel) branch uses `ViewModel` classes like this:

[`app/src/main/java/guide/graphql/toc/ui/chapters/ChaptersViewModel.kt`](https://github.com/GraphQLGuide/guide-android/blob/viewmodel/app/src/main/java/guide/graphql/toc/ui/chapters/ChaptersViewModel.kt)

```kt
package guide.graphql.toc.ui.chapters

import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.liveData
import com.apollographql.apollo.coroutines.toDeferred
import com.apollographql.apollo.exception.ApolloException
import guide.graphql.toc.ChaptersQuery
import guide.graphql.toc.data.Apollo
import guide.graphql.toc.data.Resource

class ChaptersViewModel : ViewModel() {

  val chapterList: LiveData<Resource<List<ChaptersQuery.Chapter>>> = liveData {
    emit(Resource.loading(null))
    try {
      val response = Apollo.client.query(
        ChaptersQuery()
      ).toDeferred().await()

      if (response.hasErrors()) {
        throw Exception("Response has errors")
      }

      val chapters = response.data?.chapters ?: throw Exception("Data is null")
      emit(Resource.success(chapters))
    } catch (e: ApolloException) {
      emit(Resource.error("GraphQL request failed", null))
    } catch (e: Exception) {
      emit(Resource.error(e.message.orEmpty(), null))
    }
  }
}
```

The data is wrapped in a Resource class that can be in one of three states: loading, error, or success.

And our query in the fragment is replaced by observing the state of the LiveData:

[`app/src/main/java/guide/graphql/toc/ui/chapters/ChaptersFragment.kt`](https://github.com/GraphQLGuide/guide-android/blob/viewmodel/app/src/main/java/guide/graphql/toc/ui/chapters/ChaptersFragment.kt)

```kt
  viewModel.chapterList.observe(viewLifecycleOwner, Observer { chapterListResponse ->
    when (chapterListResponse.status) {
      Status.SUCCESS -> {
        chapterListResponse.data?.let {
          adapter.updateChapters(it)
        }
      }
      Status.ERROR -> Toast.makeText(
        requireContext(),
        getString(R.string.graphql_error, chapterListResponse.message),
        Toast.LENGTH_SHORT
      ).show()
      Status.LOADING -> {
      }
    }
  })
```

