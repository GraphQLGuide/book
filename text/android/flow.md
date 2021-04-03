---
title: Flow
description: Using Apollo Android’s Flow API
---

# Flow

So far the only coroutine function we’ve been using is `toDeferred()`, which gives us a single response. Here is the full coroutines API:

```kt
fun <T> ApolloSubscriptionCall<T>.toFlow(): Flow<Response<T>>
fun <T> ApolloCall<T>.toFlow()
fun <T> ApolloQueryWatcher<T>.toFlow()
fun <T> ApolloSubscriptionCall<T>.toFlow(): Flow<Response<T>>
fun <T> ApolloCall<T>.toDeferred(): Deferred<Response<T>>
fun ApolloPrefetch.toJob(): Job
```

`toFlow()` allows us to get a stream of results. For instance, we could watch a `CACHE_AND_NETWORK` query and receive, sequentially:

- The results from the cache.
- The results from the server.
- Updated results when a query with overlapping data changes an object in the cache.

And the last type stream result can continue occurring.

The [`viewmodel-flow`](https://github.com/GraphQLGuide/guide-android/tree/viewmodel-flow) branch uses `.watcher().toFlow()`. We can compare the difference between this and the last branch on GitHub: 

[guide-android/compare/viewmodel...viewmodel-flow](https://github.com/GraphQLGuide/guide-android/compare/viewmodel...viewmodel-flow)

Here’s the updated `ViewModel` and fragment code:

[`app/src/main/java/guide/graphql/toc/ui/chapters/ChaptersViewModel.kt`](https://github.com/GraphQLGuide/guide-android/blob/viewmodel-flow/app/src/main/java/guide/graphql/toc/ui/chapters/ChaptersViewModel.kt)

```kt
package guide.graphql.toc.ui.chapters

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.asLiveData
import com.apollographql.apollo.coroutines.toFlow
import com.apollographql.apollo.fetcher.ApolloResponseFetchers
import guide.graphql.toc.ChaptersQuery
import guide.graphql.toc.data.Apollo
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map

@ExperimentalCoroutinesApi
class ChaptersViewModel : ViewModel() {

  val chapterException: MutableLiveData<Throwable?> = MutableLiveData()

  val chapterList = Apollo.client.query(ChaptersQuery())
    .responseFetcher(ApolloResponseFetchers.CACHE_AND_NETWORK).watcher().toFlow()
    .distinctUntilChanged().map { response ->
      if (response.hasErrors()) throw Exception("Response has errors")
      val chapters = response.data?.chapters ?: throw Exception("Data is null")
      chapterException.value = null
      return@map chapters
    }.catch { exception ->
      chapterException.postValue(exception)
    }.asLiveData()
}
```

[`app/src/main/java/guide/graphql/toc/ui/chapters/ChaptersFragment.kt`](https://github.com/GraphQLGuide/guide-android/blob/viewmodel-flow/app/src/main/java/guide/graphql/toc/ui/chapters/ChaptersFragment.kt)

```kt
  viewModel.chapterList.observe(viewLifecycleOwner, Observer {
    adapter.submitList(it)
  })

  viewModel.chapterException.observe(viewLifecycleOwner, Observer {
    it?.let { exception ->
      Toast.makeText(
        requireContext(),
        getString(
          R.string.graphql_error, if (exception is ApolloException)
            "GraphQL request failed"
          else
            exception.message.orEmpty()
        ),
        Toast.LENGTH_SHORT
      ).show()
    }
  })
```        

An alternative to using Apollo’s Flow API is its [RxJava3 API](https://www.apollographql.com/docs/android/advanced/rxjava3/), like this:

```kt
val observable = Apollo.client.rxQuery(ChaptersQuery())
```